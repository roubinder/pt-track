import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { findExercise, mergeWithPrescription } from "../data/exerciseDatabase";
import { addExercise, saveVisit } from "../data/storage";
import "./PDFUpload.css";

// Point pdf.js worker at the CDN version matching the installed package
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

// ─── PDF text extraction ───────────────────────────────────────────────────────

async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(" ");
    fullText += pageText + "\n";
  }
  return fullText;
}

// ─── Claude parsing ────────────────────────────────────────────────────────────

async function parsePDFWithClaude(pdfText) {
  // Send extracted text (not raw binary) to stay within Vercel's 4.5MB body limit
  const response = await fetch("/api/parse-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pdfText }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error || "Failed to parse PDF");
  }

  const data = await response.json();
  return data.exercises;
}

// ─── Exercise matching ─────────────────────────────────────────────────────────

function matchExercises(parsed) {
  return parsed.map((item) => {
    const dbMatch = findExercise(item.name);

    if (dbMatch) {
      // Known exercise — use canonical form cues + PDF prescription
      const merged = mergeWithPrescription(dbMatch, item);
      return {
        ...merged,
        source: "database",
        originalName: item.name,
      };
    } else {
      // Unknown exercise — use Claude's extracted form cues, infer type
      const type =
        item.reps && item.holdSeconds
          ? "reps-hold"
          : item.holdSeconds && !item.reps
          ? "hold"
          : "reps";

      return {
        id: null, // assigned on save
        name: item.name,
        aliases: [],
        type,
        formCues: item.formCues || "",
        sets: item.sets || 3,
        reps: item.reps || null,
        holdSeconds: item.holdSeconds || null,
        restSeconds: 20,
        frequency: item.frequency || "daily",
        source: "claude",
        originalName: item.name,
      };
    }
  });
}

// ─── Review card ───────────────────────────────────────────────────────────────

function ExerciseReviewCard({ exercise, onEdit, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [fields, setFields] = useState(exercise);

  function set(key, val) {
    setFields((f) => ({ ...f, [key]: val }));
  }

  function handleSave() {
    onEdit(fields);
    setEditing(false);
  }

  const badge =
    exercise.source === "database" ? "matched" : "new";

  return (
    <div className={`pdf-review-card pdf-review-card--${badge}`}>
      <div className="pdf-review-card-header">
        <div>
          <p className="pdf-review-card-name">{fields.name}</p>
          <span className={`pdf-review-badge pdf-review-badge--${badge}`}>
            {badge === "matched" ? "✓ matched" : "✦ new exercise"}
          </span>
        </div>
        <div className="pdf-review-card-actions">
          <button className="pdf-review-btn" onClick={() => setEditing(!editing)}>
            {editing ? "Cancel" : "Edit"}
          </button>
          <button className="pdf-review-btn pdf-review-btn--remove" onClick={onRemove}>
            Remove
          </button>
        </div>
      </div>

      {editing ? (
        <div className="pdf-review-edit">
          <div className="pdf-review-edit-row">
            <label>
              Sets
              <input
                type="number"
                value={fields.sets || ""}
                onChange={(e) => set("sets", parseInt(e.target.value) || null)}
                className="pdf-review-input"
              />
            </label>
            <label>
              Reps
              <input
                type="number"
                value={fields.reps || ""}
                onChange={(e) => set("reps", parseInt(e.target.value) || null)}
                className="pdf-review-input"
              />
            </label>
            <label>
              Hold (s)
              <input
                type="number"
                value={fields.holdSeconds || ""}
                onChange={(e) => set("holdSeconds", parseInt(e.target.value) || null)}
                className="pdf-review-input"
              />
            </label>
          </div>
          <label className="pdf-review-label">
            Form cues
            <textarea
              className="pdf-review-textarea"
              value={fields.formCues}
              onChange={(e) => set("formCues", e.target.value)}
              rows={3}
            />
          </label>
          <button className="pdf-review-save-btn" onClick={handleSave}>
            Save changes
          </button>
        </div>
      ) : (
        <div className="pdf-review-details">
          <p className="pdf-review-params">
            {fields.sets} sets
            {fields.reps ? ` · ${fields.reps} reps` : ""}
            {fields.holdSeconds ? ` · ${fields.holdSeconds}s hold` : ""}
            {" · "}
            {fields.frequency === "daily" ? "daily" : "every other day"}
          </p>
          <p className="pdf-review-cue">{fields.formCues}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function PDFUpload({ onDone }) {
  const [stage, setStage] = useState("upload"); // upload | parsing | review | saving | done
  const [exercises, setExercises] = useState([]);
  const [error, setError] = useState(null);

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file || file.type !== "application/pdf") {
      setError("Please select a PDF file.");
      return;
    }

    setError(null);
    setStage("parsing");

    try {
      // Extract text from PDF client-side (avoids 4.5MB Vercel body limit)
      const pdfText = await extractTextFromPDF(file);
      const parsed = await parsePDFWithClaude(pdfText);
      const matched = matchExercises(parsed);
      setExercises(matched);
      setStage("review");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setStage("upload");
    }
  }

  function handleEdit(index, updated) {
    setExercises((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, ...updated } : ex))
    );
  }

  function handleRemove(index) {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleConfirm() {
    setStage("saving");

    // Save a visit record
    const visit = saveVisit({
      date: new Date().toISOString().slice(0, 10),
      notes: "Imported from PT PDF",
      changes: exercises.map((ex) => ({
        type: "added",
        exerciseName: ex.name,
      })),
    });

    // Save each exercise
    exercises.forEach((ex) => {
      addExercise({
        name: ex.name,
        formCue: ex.formCues,
        type: ex.type,
        sets: ex.sets,
        reps: ex.reps || null,
        holdSeconds: ex.holdSeconds || null,
        restSeconds: ex.restSeconds || 20,
        frequency: ex.frequency || "daily",
        visitId: visit.id,
      });
    });

    setStage("done");
  }

  // ── Upload stage ──
  if (stage === "upload") {
    return (
      <div className="pdf-screen pdf-screen--center">
        <div className="pdf-upload-icon">📄</div>
        <h1 className="pdf-title">Import PT program</h1>
        <p className="pdf-subtitle">
          Upload the PDF your physical therapist emailed you. We'll extract your
          exercises automatically.
        </p>

        {error && <p className="pdf-error">{error}</p>}

        <label className="pdf-upload-btn">
          Choose PDF
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </label>

        <button className="pdf-skip-btn" onClick={onDone}>
          Skip — I'll enter exercises manually
        </button>
      </div>
    );
  }

  // ── Parsing stage ──
  if (stage === "parsing") {
    return (
      <div className="pdf-screen pdf-screen--center">
        <div className="pdf-spinner" />
        <p className="pdf-parsing-label">Reading your PT program…</p>
        <p className="pdf-parsing-sub">This takes about 10 seconds</p>
      </div>
    );
  }

  // ── Review stage ──
  if (stage === "review") {
    return (
      <div className="pdf-screen">
        <div className="pdf-topbar">
          <h1 className="pdf-topbar-title">Review exercises</h1>
          <p className="pdf-topbar-sub">
            {exercises.length} exercises found · edit anything before saving
          </p>
        </div>

        <div className="pdf-review-list">
          {exercises.map((ex, i) => (
            <ExerciseReviewCard
              key={i}
              exercise={ex}
              onEdit={(updated) => handleEdit(i, updated)}
              onRemove={() => handleRemove(i)}
            />
          ))}
        </div>

        <div className="pdf-review-footer">
          <button className="pdf-confirm-btn" onClick={handleConfirm}>
            Save {exercises.length} exercises
          </button>
        </div>
      </div>
    );
  }

  // ── Done stage ──
  return (
    <div className="pdf-screen pdf-screen--center">
      <div className="pdf-done-icon">✓</div>
      <h1 className="pdf-title">Program imported</h1>
      <p className="pdf-subtitle">
        Your exercises are ready. Start your first session from the Today screen.
      </p>
      <button className="pdf-confirm-btn" onClick={onDone}>
        Go to Today
      </button>
    </div>
  );
}

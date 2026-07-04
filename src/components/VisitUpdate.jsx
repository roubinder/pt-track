import { useState } from "react";
import {
  loadActiveExercises,
  addExercise,
  updateExercise,
  retireExercise,
  saveVisit,
} from "../data/storage";
import "./VisitUpdate.css";

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

const BLANK_EXERCISE = {
  name: "",
  formCue: "",
  type: "reps",
  reps: 10,
  holdSeconds: 30,
  sets: 3,
  restSeconds: 20,
  frequency: "daily",
};

function ExerciseForm({ initial, onSave, onCancel, isNew }) {
  const [fields, setFields] = useState({ ...BLANK_EXERCISE, ...initial });

  function set(key, value) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  function handleSave() {
    if (!fields.name.trim()) return;
    onSave(fields);
  }

  return (
    <div className="vu-exercise-form">
      <label className="vu-label">
        Exercise name
        <input
          className="vu-input"
          value={fields.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Clamshells"
        />
      </label>

      <label className="vu-label">
        Form cue (optional)
        <textarea
          className="vu-input vu-textarea"
          value={fields.formCue}
          onChange={(e) => set("formCue", e.target.value)}
          placeholder="What your PT told you to focus on"
          rows={2}
        />
      </label>

      <div className="vu-row">
        <label className="vu-label">
          Type
          <select
            className="vu-input"
            value={fields.type}
            onChange={(e) => set("type", e.target.value)}
          >
            <option value="reps">Reps</option>
            <option value="hold">Hold / timed</option>
          </select>
        </label>

        <label className="vu-label">
          Sets
          <input
            className="vu-input"
            type="number"
            min={1}
            max={10}
            value={fields.sets}
            onChange={(e) => set("sets", parseInt(e.target.value) || 1)}
          />
        </label>
      </div>

      <div className="vu-row">
        {fields.type === "reps" ? (
          <label className="vu-label">
            Reps per set
            <input
              className="vu-input"
              type="number"
              min={1}
              value={fields.reps}
              onChange={(e) => set("reps", parseInt(e.target.value) || 1)}
            />
          </label>
        ) : (
          <label className="vu-label">
            Hold duration (seconds)
            <input
              className="vu-input"
              type="number"
              min={5}
              value={fields.holdSeconds}
              onChange={(e) => set("holdSeconds", parseInt(e.target.value) || 10)}
            />
          </label>
        )}

        <label className="vu-label">
          Rest between sets (s)
          <input
            className="vu-input"
            type="number"
            min={5}
            value={fields.restSeconds}
            onChange={(e) => set("restSeconds", parseInt(e.target.value) || 10)}
          />
        </label>
      </div>

      <label className="vu-label">
        Frequency
        <select
          className="vu-input"
          value={fields.frequency}
          onChange={(e) => set("frequency", e.target.value)}
        >
          <option value="daily">Daily</option>
          <option value="alternate">Every other day</option>
        </select>
      </label>

      <div className="vu-form-actions">
        <button className="vu-btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="vu-btn-primary"
          onClick={handleSave}
          disabled={!fields.name.trim()}
        >
          {isNew ? "Add exercise" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

export default function VisitUpdate({ onDone }) {
  const [visitDate, setVisitDate] = useState(todayString());
  const [visitNotes, setVisitNotes] = useState("");
  const [exercises, setExercises] = useState(() => loadActiveExercises());
  const [editingId, setEditingId] = useState(null); // null | "new" | exercise.id
  const [changes, setChanges] = useState([]);
  const [saved, setSaved] = useState(false);

  function handleAddNew(fields) {
    const ex = addExercise({ ...fields, visitId: "pending" });
    setExercises(loadActiveExercises());
    setChanges((c) => [...c, { type: "added", exerciseId: ex.id, exerciseName: ex.name }]);
    setEditingId(null);
  }

  function handleUpdate(id, fields) {
    const ex = updateExercise(id, fields);
    setExercises(loadActiveExercises());
    setChanges((c) => [...c, { type: "updated", exerciseId: id, exerciseName: ex.name }]);
    setEditingId(null);
  }

  function handleRetire(id, name) {
    retireExercise(id);
    setExercises(loadActiveExercises());
    setChanges((c) => [...c, { type: "retired", exerciseId: id, exerciseName: name }]);
  }

  function handleSaveVisit() {
    const visit = saveVisit({ date: visitDate, notes: visitNotes, changes });
    // Update visitId on newly added exercises
    changes
      .filter((c) => c.type === "added")
      .forEach((c) => updateExercise(c.exerciseId, { visitId: visit.id }));
    setSaved(true);
  }

  if (saved) {
    return (
      <div className="vu-screen vu-screen--center">
        <p className="vu-saved-icon">✓</p>
        <h2 className="vu-saved-title">Visit saved</h2>
        <p className="vu-saved-sub">Your exercise plan has been updated.</p>
        <button className="vu-btn-primary vu-btn-full" onClick={onDone}>
          Back to today
        </button>
      </div>
    );
  }

  return (
    <div className="vu-screen">
      <div className="vu-topbar">
        <button className="vu-back-btn" onClick={onDone}>← Back</button>
        <h1 className="vu-title">Update plan</h1>
      </div>

      {/* Visit date + notes */}
      <div className="vu-section">
        <p className="vu-section-label">PT visit</p>
        <label className="vu-label">
          Visit date
          <input
            className="vu-input"
            type="date"
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
          />
        </label>
        <label className="vu-label">
          Notes / precautions (optional)
          <textarea
            className="vu-input vu-textarea"
            value={visitNotes}
            onChange={(e) => setVisitNotes(e.target.value)}
            placeholder="General notes from your PT"
            rows={2}
          />
        </label>
      </div>

      {/* Current exercises */}
      <div className="vu-section">
        <p className="vu-section-label">Exercises</p>

        {exercises.length === 0 && editingId !== "new" && (
          <p className="vu-empty-hint">No exercises yet. Add your first one below.</p>
        )}

        {exercises.map((ex) =>
          editingId === ex.id ? (
            <ExerciseForm
              key={ex.id}
              initial={ex}
              isNew={false}
              onSave={(fields) => handleUpdate(ex.id, fields)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div key={ex.id} className="vu-exercise-row">
              <div className="vu-exercise-row-info">
                <p className="vu-exercise-row-name">{ex.name}</p>
                <p className="vu-exercise-row-meta">
                  {ex.type === "reps"
                    ? `${ex.sets}×${ex.reps} reps`
                    : `${ex.sets}×${ex.holdSeconds}s hold`}
                  {" · "}
                  {ex.frequency === "daily" ? "daily" : "every other day"}
                </p>
              </div>
              <div className="vu-exercise-row-actions">
                <button
                  className="vu-row-btn"
                  onClick={() => setEditingId(ex.id)}
                >
                  Edit
                </button>
                <button
                  className="vu-row-btn vu-row-btn--retire"
                  onClick={() => handleRetire(ex.id, ex.name)}
                >
                  Retire
                </button>
              </div>
            </div>
          )
        )}

        {editingId === "new" ? (
          <ExerciseForm
            initial={BLANK_EXERCISE}
            isNew={true}
            onSave={handleAddNew}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <button
            className="vu-add-btn"
            onClick={() => setEditingId("new")}
          >
            + Add exercise
          </button>
        )}
      </div>

      {/* Save visit */}
      <div className="vu-footer">
        <button
          className="vu-btn-primary vu-btn-full"
          onClick={handleSaveVisit}
        >
          Save visit
        </button>
      </div>
    </div>
  );
}

import { useState } from "react";
import GuidedSession from "./components/GuidedSession";
import SessionSummary from "./components/SessionSummary";
import { SESSION_EXERCISES } from "./data/exercises";
import {
  saveSession,
  loadSessions,
  computeStreak,
  computeWeekAdherence,
  sessionCompletionLevel,
} from "./data/storage";
import "./App.css";

export default function App() {
  const [screen, setScreen] = useState("start"); // "start" | "session" | "summary"
  const [summaryData, setSummaryData] = useState(null);

  function handleStart() {
    setScreen("session");
  }

  function handleComplete(entries) {
    // Save to localStorage
    const session = saveSession(entries);

    // Compute stats from all sessions including this one
    const allSessions = loadSessions();
    const streak = computeStreak(allSessions);
    const weekAdherence = computeWeekAdherence(allSessions);
    const completionLevel = sessionCompletionLevel(entries);

    setSummaryData({ session, streak, weekAdherence, completionLevel });
    setScreen("summary");
  }

  function handleDone() {
    setSummaryData(null);
    setScreen("start");
  }

  if (screen === "session") {
    return <GuidedSession exercises={SESSION_EXERCISES} onComplete={handleComplete} />;
  }

  if (screen === "summary" && summaryData) {
    return (
      <SessionSummary
        session={summaryData.session}
        streak={summaryData.streak}
        weekAdherence={summaryData.weekAdherence}
        completionLevel={summaryData.completionLevel}
        onDone={handleDone}
      />
    );
  }

  return (
    <div className="app-screen app-screen--center">
      <p className="app-eyebrow">PT Track</p>
      <h1 className="app-title">Today's session</h1>
      <p className="app-subtitle">
        {SESSION_EXERCISES.length} exercises
      </p>
      <button className="app-primary-btn" onClick={handleStart}>
        Start session
      </button>
    </div>
  );
}

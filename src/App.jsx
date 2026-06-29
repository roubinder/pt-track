import { useState } from "react";
import GuidedSession from "./components/GuidedSession";
import { SESSION_EXERCISES } from "./data/exercises";
import "./App.css";

export default function App() {
  const [screen, setScreen] = useState("start"); // "start" | "session" | "complete"
  const [sessionLog, setSessionLog] = useState(null);

  function handleStart() {
    setScreen("session");
  }

  function handleComplete(log) {
    setSessionLog(log);
    setScreen("complete");
  }

  function handleRestart() {
    setSessionLog(null);
    setScreen("start");
  }

  if (screen === "session") {
    return <GuidedSession exercises={SESSION_EXERCISES} onComplete={handleComplete} />;
  }

  if (screen === "complete") {
    return (
      <div className="app-screen app-screen--center">
        <p className="app-eyebrow">Session log (Phase 1 debug view)</p>
        <h1 className="app-title">Done</h1>
        <ul className="app-log-list">
          {sessionLog.map((entry) => (
            <li key={entry.exerciseId}>
              {entry.exerciseName}: {entry.setsCompleted} of {entry.setsPrescribed} sets
            </li>
          ))}
        </ul>
        <button className="app-primary-btn" onClick={handleRestart}>
          Back to start
        </button>
      </div>
    );
  }

  return (
    <div className="app-screen app-screen--center">
      <p className="app-eyebrow">PT Track — Phase 1</p>
      <h1 className="app-title">Today's session</h1>
      <p className="app-subtitle">
        {SESSION_EXERCISES.length} exercises &middot; hardcoded for testing
      </p>
      <button className="app-primary-btn" onClick={handleStart}>
        Start session
      </button>
    </div>
  );
}

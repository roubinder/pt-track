import "./SessionSummary.css";

const MESSAGES = {
  full: [
    "Full session done. Strong work.",
    "All exercises completed. Your hip will thank you.",
    "Perfect session. That's how healing happens.",
    "Every rep counts. Great session today.",
  ],
  partial: [
    "You showed up. That matters.",
    "Partial session still moves the needle.",
    "Something is always better than nothing.",
    "Progress, not perfection. Good work.",
  ],
  none: [
    "Tomorrow is a fresh start.",
    "Rest days happen. Come back tomorrow.",
    "No streak today, but you opened the app. That counts for something.",
  ],
};

function pickMessage(level, sessionId) {
  const options = MESSAGES[level];
  // Pick deterministically based on session id so it doesn't
  // re-randomize on re-render, but varies across sessions.
  const index = parseInt(sessionId, 10) % options.length;
  return options[index];
}

function StreakFlame({ streak }) {
  // Flame intensity scales with streak length
  const color =
    streak === 0
      ? "var(--ink-faint)"
      : streak >= 7
      ? "#e85d04"
      : streak >= 3
      ? "#f48c06"
      : "#faa307";

  return (
    <div className="summary-streak-icon" style={{ color }}>
      {streak === 0 ? "○" : "🔥"}
    </div>
  );
}

export default function SessionSummary({
  session,       // the saved session object { id, date, entries }
  streak,        // computed streak count
  weekAdherence, // computed week adherence %
  completionLevel, // "full" | "partial" | "none"
  onDone,        // callback to return to start screen
}) {
  const completedCount = session.entries.filter((e) => e.setsCompleted > 0).length;
  const totalCount = session.entries.length;
  const message = pickMessage(completionLevel, session.id);

  return (
    <div className="summary-screen">
      <div className="summary-card">

        <StreakFlame streak={streak} />

        <div className="summary-streak-number">{streak}</div>
        <div className="summary-streak-label">
          {streak === 1 ? "day streak" : "day streak"}
        </div>

        <p className="summary-message">{message}</p>

        <div className="summary-stats">
          <div className="summary-stat">
            <span className="summary-stat-value">
              {completedCount}/{totalCount}
            </span>
            <span className="summary-stat-label">exercises</span>
          </div>
          <div className="summary-stat-divider" />
          <div className="summary-stat">
            <span className="summary-stat-value">{weekAdherence}%</span>
            <span className="summary-stat-label">this week</span>
          </div>
        </div>

        {completionLevel !== "none" && (
          <div className="summary-exercise-list">
            {session.entries.map((entry) => (
              <div key={entry.exerciseId} className="summary-exercise-row">
                <span
                  className={`summary-exercise-dot ${
                    entry.setsCompleted > 0
                      ? "summary-exercise-dot--done"
                      : "summary-exercise-dot--skipped"
                  }`}
                />
                <span className="summary-exercise-name">{entry.exerciseName}</span>
                <span className="summary-exercise-sets">
                  {entry.setsCompleted > 0
                    ? `${entry.setsCompleted}/${entry.setsPrescribed} sets`
                    : "skipped"}
                </span>
              </div>
            ))}
          </div>
        )}

      </div>

      <button className="summary-done-btn" onClick={onDone}>
        Done
      </button>
    </div>
  );
}

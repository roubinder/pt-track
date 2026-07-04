import "./TodayScreen.css";

function formatFrequency(ex) {
  if (ex.type === "hold") {
    return `${ex.sets} sets · ${ex.holdSeconds}s hold · ${ex.frequency === "daily" ? "daily" : "every other day"}`;
  }
  return `${ex.sets} sets · ${ex.reps} reps · ${ex.frequency === "daily" ? "daily" : "every other day"}`;
}

export default function TodayScreen({
  exercises,       // today's exercises from getTodaysExercises()
  weekAdherence,   // number 0-100
  streak,          // current streak
  onStartSession,
  onUpdatePlan,
}) {
  const hasExercises = exercises.length > 0;

  return (
    <div className="today-screen">
      <div className="today-header">
        <div>
          <p className="today-eyebrow">PT Track</p>
          <h1 className="today-title">Today</h1>
        </div>
        <button className="today-plan-btn" onClick={onUpdatePlan}>
          Update plan
        </button>
      </div>

      {/* Stats bar */}
      <div className="today-stats">
        <div className="today-stat">
          <span className="today-stat-value">{streak}</span>
          <span className="today-stat-label">day streak</span>
        </div>
        <div className="today-stat-divider" />
        <div className="today-stat">
          <span className="today-stat-value">{weekAdherence}%</span>
          <span className="today-stat-label">this week</span>
        </div>
      </div>

      {/* Exercise list */}
      {hasExercises ? (
        <div className="today-exercise-list">
          {exercises.map((ex) => (
            <div key={ex.id} className="today-exercise-card">
              <div className="today-exercise-info">
                <p className="today-exercise-name">{ex.name}</p>
                <p className="today-exercise-meta">{formatFrequency(ex)}</p>
                {ex.formCue ? (
                  <p className="today-exercise-cue">{ex.formCue}</p>
                ) : null}
              </div>
              <span className={`today-exercise-type today-exercise-type--${ex.type}`}>
                {ex.type === "hold" ? "hold" : "reps"}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="today-empty">
          <p className="today-empty-title">No exercises yet</p>
          <p className="today-empty-sub">
            Add your PT exercises by tapping "Update plan" above.
          </p>
        </div>
      )}

      {/* Start session */}
      {hasExercises && (
        <div className="today-footer">
          <button className="today-start-btn" onClick={onStartSession}>
            Start session
          </button>
        </div>
      )}
    </div>
  );
}

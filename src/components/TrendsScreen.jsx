import {
  loadSessions,
  computeExerciseTrends,
  computeOverallAdherence,
  getLast28Days,
} from "../data/storage";
import "./TrendsScreen.css";

function CompletionBar({ rate }) {
  const color =
    rate >= 80 ? "var(--accent)" : rate >= 50 ? "#b9762f" : "#dc2626";
  return (
    <div className="trends-bar-track">
      <div
        className="trends-bar-fill"
        style={{ width: `${rate}%`, background: color }}
      />
    </div>
  );
}

function HeatMap({ days }) {
  // Split 28 days into 4 rows of 7 (weeks)
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className="trends-heatmap">
      <div className="trends-heatmap-labels">
        {dayLabels.map((d, i) => (
          <span key={i} className="trends-heatmap-label">{d}</span>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="trends-heatmap-row">
          {week.map((day) => (
            <div
              key={day.date}
              className={`trends-heatmap-cell ${
                day.completed ? "trends-heatmap-cell--done" : ""
              }`}
              title={day.date}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function TrendsScreen({ onBack }) {
  const sessions = loadSessions();
  const exerciseTrends = computeExerciseTrends(sessions);
  const overallAdherence = computeOverallAdherence(sessions);
  const last28Days = getLast28Days(sessions);
  const totalSessions = sessions.length;

  const isEmpty = sessions.length === 0;

  return (
    <div className="trends-screen">
      <div className="trends-topbar">
        <button className="trends-back-btn" onClick={onBack}>← Back</button>
        <h1 className="trends-title">Trends</h1>
      </div>

      {isEmpty ? (
        <div className="trends-empty">
          <p className="trends-empty-title">No data yet</p>
          <p className="trends-empty-sub">
            Complete a session to start seeing your trends here.
          </p>
        </div>
      ) : (
        <>
          {/* Overall stats */}
          <div className="trends-section">
            <p className="trends-section-label">Overall</p>
            <div className="trends-stats-row">
              <div className="trends-stat-card">
                <span className="trends-stat-value">{overallAdherence}%</span>
                <span className="trends-stat-label">all-time adherence</span>
              </div>
              <div className="trends-stat-card">
                <span className="trends-stat-value">{totalSessions}</span>
                <span className="trends-stat-label">total sessions</span>
              </div>
            </div>
          </div>

          {/* 28-day heatmap */}
          <div className="trends-section">
            <p className="trends-section-label">Last 28 days</p>
            <div className="trends-card">
              <HeatMap days={last28Days} />
              <div className="trends-heatmap-legend">
                <div className="trends-heatmap-cell trends-heatmap-cell--done trends-heatmap-cell--sm" />
                <span>session completed</span>
                <div className="trends-heatmap-cell trends-heatmap-cell--sm" style={{ marginLeft: 12 }} />
                <span>no session</span>
              </div>
            </div>
          </div>

          {/* Per-exercise breakdown */}
          <div className="trends-section">
            <p className="trends-section-label">By exercise</p>
            {exerciseTrends.length === 0 ? (
              <p className="trends-empty-sub">No exercise data yet.</p>
            ) : (
              <div className="trends-exercise-list">
                {exerciseTrends.map((ex) => (
                  <div key={ex.exerciseId} className="trends-exercise-card">
                    <div className="trends-exercise-header">
                      <p className="trends-exercise-name">{ex.exerciseName}</p>
                      <span className="trends-exercise-rate">
                        {ex.completionRate}%
                      </span>
                    </div>
                    <CompletionBar rate={ex.completionRate} />
                    <p className="trends-exercise-detail">
                      Completed {ex.timesCompleted} of {ex.timesPrescribed} sessions
                      {" · "}
                      {ex.totalSetsCompleted}/{ex.totalSetsPrescribed} sets total
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

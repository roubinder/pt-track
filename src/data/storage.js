// storage.js — localStorage read/write for all PT Track data.
// Exercises, Visits, and Sessions (log entries).

const EXERCISES_KEY  = "pt_track_exercises";
const VISITS_KEY     = "pt_track_visits";
const SESSIONS_KEY   = "pt_track_sessions";

// ─── Exercises ────────────────────────────────────────────────────────────────
// { id, name, formCue, type:"reps"|"hold", reps, holdSeconds, sets,
//   restSeconds, frequency:"daily"|"alternate", status:"active"|"retired",
//   visitId, createdAt }

export function loadExercises() {
  try {
    const raw = localStorage.getItem(EXERCISES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveExercises(exercises) {
  try { localStorage.setItem(EXERCISES_KEY, JSON.stringify(exercises)); }
  catch { /* silent */ }
}

export function loadActiveExercises() {
  return loadExercises().filter((e) => e.status === "active");
}

export function addExercise(fields) {
  const exercises = loadExercises();
  const exercise = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    status: "active",
    restSeconds: 20,
    ...fields,
  };
  exercises.push(exercise);
  saveExercises(exercises);
  return exercise;
}

export function updateExercise(id, fields) {
  const exercises = loadExercises();
  const idx = exercises.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  exercises[idx] = { ...exercises[idx], ...fields };
  saveExercises(exercises);
  return exercises[idx];
}

export function retireExercise(id) {
  return updateExercise(id, { status: "retired" });
}

// ─── Visits ───────────────────────────────────────────────────────────────────
// { id, date:"YYYY-MM-DD", notes, changes:[{type, exerciseId, exerciseName}],
//   createdAt }

export function loadVisits() {
  try {
    const raw = localStorage.getItem(VISITS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveVisit(fields) {
  const visits = loadVisits();
  const visit = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    changes: [],
    ...fields,
  };
  visits.push(visit);
  try { localStorage.setItem(VISITS_KEY, JSON.stringify(visits)); }
  catch { /* silent */ }
  return visit;
}

// ─── Schedule ─────────────────────────────────────────────────────────────────
// Returns active exercises due today.
// "daily"     → every day
// "alternate" → every other day based on days since exercise was created

export function getTodaysExercises() {
  const active = loadActiveExercises();
  const todayMs = new Date().setHours(0, 0, 0, 0);
  return active.filter((ex) => {
    if (ex.frequency === "daily") return true;
    const createdMs = new Date(ex.createdAt).setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((todayMs - createdMs) / 86400000);
    return daysDiff % 2 === 0;
  });
}

// A session record stored in localStorage:
// {
//   id: string (timestamp-based),
//   date: "YYYY-MM-DD",
//   completedAt: ISO string,
//   entries: [{ exerciseId, exerciseName, setsCompleted, setsPrescribed }]
// }

function todayString() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function dateString(date) {
  return date.toISOString().slice(0, 10);
}

export function loadSessions() {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSession(entries) {
  const sessions = loadSessions();
  const session = {
    id: Date.now().toString(),
    date: todayString(),
    completedAt: new Date().toISOString(),
    entries,
  };
  sessions.push(session);
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch {
    // localStorage full or unavailable — fail silently for now
  }
  return session;
}

// A session "counts" toward the streak if at least one exercise
// was actually completed (setsCompleted > 0).
function sessionCounts(session) {
  return session.entries.some((e) => e.setsCompleted > 0);
}

// Streak = consecutive calendar days (going back from today) where
// at least one counting session exists.
export function computeStreak(sessions) {
  if (!sessions.length) return 0;

  // Build a Set of dates that have at least one counting session.
  const countingDates = new Set(
    sessions.filter(sessionCounts).map((s) => s.date)
  );

  let streak = 0;
  const today = new Date();

  // Walk backwards from today. If today has no session yet, we still
  // allow the streak to remain intact (don't break on today being absent —
  // the user might not have done today's session yet).
  // We break as soon as we hit a day with no counting session.
  let checking = new Date(today);

  // If today has no session yet, start checking from yesterday
  // so an in-progress streak doesn't show as broken mid-day.
  if (!countingDates.has(dateString(checking))) {
    checking.setDate(checking.getDate() - 1);
  }

  // Walk back until we find a day with no session
  while (countingDates.has(dateString(checking))) {
    streak++;
    checking.setDate(checking.getDate() - 1);
  }

  return streak;
}

// Week adherence = sessions this calendar week (Mon–today) where
// at least one exercise was completed, divided by days elapsed so far
// this week (so it's a realistic daily completion rate, not penalizing
// future days that haven't happened yet).
export function computeWeekAdherence(sessions) {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ...
  // Days since Monday (treating Sunday as day 7, not 0)
  const daysSinceMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  // Build the set of dates Mon through today
  const weekDates = new Set();
  for (let i = 0; i <= daysSinceMon; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - (daysSinceMon - i));
    weekDates.add(dateString(d));
  }

  const daysElapsed = daysSinceMon + 1; // at least 1 (today)

  // Count distinct days this week that have at least one counting session
  const activeDaysThisWeek = new Set(
    sessions
      .filter((s) => weekDates.has(s.date) && sessionCounts(s))
      .map((s) => s.date)
  ).size;

  return Math.round((activeDaysThisWeek / daysElapsed) * 100);
}

// Completion level for this specific session's message tone
export function sessionCompletionLevel(entries) {
  const total = entries.length;
  const completed = entries.filter((e) => e.setsCompleted > 0).length;
  if (completed === 0) return "none";
  if (completed === total) return "full";
  return "partial";
}

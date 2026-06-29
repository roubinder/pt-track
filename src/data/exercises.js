// Phase 1: hardcoded fake exercises, matching the locked Exercise data model.
// type: "hold" -> auto-countdown, no button
// type: "reps" -> manual "Done" tap per set
// holdSeconds is used for type "hold"; reps is used for type "reps"
// restSeconds is the rest timer between sets (auto-advances at 0)

export const SESSION_EXERCISES = [
  {
    id: "ex-1",
    name: "Clamshells",
    formCue: "Keep hips stacked, don't let your back roll. Squeeze through the glute.",
    type: "reps",
    reps: 15,
    sets: 3,
    restSeconds: 20,
  },
  {
    id: "ex-2",
    name: "Bridges",
    formCue: "Keep core engaged, squeeze glutes at top, don't arch your lower back.",
    type: "reps",
    reps: 12,
    sets: 2,
    restSeconds: 20,
  },
  {
    id: "ex-3",
    name: "Hip flexor stretch",
    formCue: "Lean forward gently, no bouncing. Stop short of pain.",
    type: "hold",
    holdSeconds: 30,
    sets: 2,
    restSeconds: 15,
  },
];

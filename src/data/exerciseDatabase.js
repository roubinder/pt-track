// exerciseDatabase.js — canonical exercise definitions.
// Each entry is the source of truth for form cues and exercise type.
// The PDF upload feature matches against this list by name (case-insensitive).
// Unrecognized exercises get auto-added here with Claude-generated form cues.
//
// Fields:
//   id:        stable identifier, kebab-case
//   name:      canonical display name (must match PT PDF names closely)
//   aliases:   alternate names PTs might use for the same exercise
//   type:      "reps" | "hold" | "reps-hold" (reps with a hold at the top of each rep)
//   formCues:  canonical instructions shown during guided session
//   defaults:  { sets, reps, holdSeconds, restSeconds } — used when PDF is ambiguous

export const EXERCISE_DATABASE = [
  {
    id: "dl-hip-bridge",
    name: "DL Hip Bridge",
    aliases: ["double leg hip bridge", "hip bridge", "bridges", "glute bridge"],
    type: "reps",
    formCues:
      "Lay flat on your back with knees bent, feet shoulder width apart. Tighten your lower abs and squeeze your glutes, then push through your heels to raise your hips into a bridge. Avoid coming up too high or arching your back.",
    defaults: { sets: 3, reps: 10, restSeconds: 20 },
  },
  {
    id: "clam-shells",
    name: "Clam Shells",
    aliases: ["clamshells", "clam shell", "clamshell"],
    type: "reps-hold",
    formCues:
      "Lay on your side with hips stacked, knees bent 45 degrees. Engage your core by pulling your belly button in. Keep feet touching and slowly raise your upper knee as high as you can without shifting your hips or pelvis. Hold at the top, then slowly return.",
    defaults: { sets: 3, reps: 10, holdSeconds: 3, restSeconds: 20 },
  },
  {
    id: "side-lying-hip-abduction",
    name: "Side Lying Hip Abduction",
    aliases: ["hip abduction", "side lying abduction"],
    type: "reps-hold",
    formCues:
      "Lie on your side with your involved leg on top. Position top leg in slight extension with foot turned down. Lift leg parallel to the floor, then engage outer hip muscles to lift toward the ceiling and hold. Keep lower back neutral with abs engaged. Slowly lower back to start.",
    defaults: { sets: 3, reps: 10, holdSeconds: 2, restSeconds: 20 },
  },
  {
    id: "step-ups",
    name: "Step Ups",
    aliases: ["step up"],
    type: "reps",
    formCues:
      "Stand upright, feet shoulder width apart, with a box or step in front of you. Lift one leg onto the box and plant it flat. Lift the other leg up to the box as well. Slowly return the second leg to the floor, then the first.",
    defaults: { sets: 3, reps: 10, restSeconds: 30 },
  },
  {
    id: "split-squat",
    name: "Split Squat",
    aliases: ["bulgarian split squat", "lunge hold"],
    type: "hold",
    formCues:
      "Take a long stride stance and drop into a lunge. Knees and hips bent at 90 degrees, trunk vertical like an elevator. Place weight in your front heel to engage glutes, weight in toes of back foot to engage quad — 50/50 between legs. Hold the position.",
    defaults: { sets: 3, holdSeconds: 30, restSeconds: 30 },
  },
  {
    id: "sit-to-stand",
    name: "Sit To Stand without Support",
    aliases: ["sit to stand", "sit-to-stand", "chair stand"],
    type: "reps",
    formCues:
      "Sit at the front edge of your chair. Keep weight in your heels and gaze neutral. Raise your body up to standing, holding arms at 90 degrees for balance. Slowly return to seated.",
    defaults: { sets: 3, reps: 10, restSeconds: 20 },
  },
  {
    id: "sktc",
    name: "Single Knee to Chest Stretch",
    aliases: ["knee to chest", "sktc", "single knee to chest"],
    type: "hold",
    formCues:
      "Lie flat on the ground, hands on chest, feet pointed toward the ceiling. Bend one leg at the knee and pull it toward your chest slowly with both arms. You can also hold behind the knee for more leverage. Hold for the specified time, then return to start.",
    defaults: { sets: 3, reps: 3, holdSeconds: 30, restSeconds: 15 },
  },
  {
    id: "single-leg-marching",
    name: "Single Leg Standing Marching",
    aliases: ["single leg march", "standing march", "marching"],
    type: "reps-hold",
    formCues:
      "Start standing. Lift one foot and knee up and hold for the specified time. Use your arms for support if needed for balance and safety. Return to start and repeat.",
    defaults: { sets: 2, reps: 10, holdSeconds: 5, restSeconds: 20 },
  },
];

// Look up an exercise by name or alias (case-insensitive).
// Returns the matching database entry or null.
export function findExercise(name) {
  const normalized = name.toLowerCase().trim();
  return (
    EXERCISE_DATABASE.find(
      (ex) =>
        ex.name.toLowerCase() === normalized ||
        ex.aliases.some((a) => a.toLowerCase() === normalized)
    ) || null
  );
}

// Merge a database entry with PDF-prescribed params.
// PDF params take precedence for sets/reps/hold (PT-specific prescription);
// database provides form cues and type.
export function mergeWithPrescription(dbEntry, prescribed) {
  return {
    ...dbEntry,
    sets: prescribed.sets ?? dbEntry.defaults.sets,
    reps: prescribed.reps ?? dbEntry.defaults.reps,
    holdSeconds: prescribed.holdSeconds ?? dbEntry.defaults.holdSeconds,
    restSeconds: dbEntry.defaults.restSeconds,
    frequency: prescribed.frequency ?? "daily",
  };
}

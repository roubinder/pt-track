import { useState, useEffect, useRef, useCallback } from "react";
import "./GuidedSession.css";

// Session phases for the current exercise:
// "active"  -> doing the current set (reps: waiting for Done tap; hold: counting down)
// "resting" -> rest timer running between sets
// "done"    -> whole session finished, handled by parent (onComplete)

function useCountdown(startSeconds, onComplete, isRunning) {
  const [secondsLeft, setSecondsLeft] = useState(startSeconds);
  const onCompleteRef = useRef(onComplete);
  const firedRef = useRef(false);
  onCompleteRef.current = onComplete;

  // Reset whenever this countdown is (re)started.
  useEffect(() => {
    setSecondsLeft(startSeconds);
    firedRef.current = false;
  }, [startSeconds, isRunning]);

  useEffect(() => {
    if (!isRunning || firedRef.current) return;
    if (secondsLeft <= 0) {
      firedRef.current = true;
      onCompleteRef.current();
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft, isRunning]);

  return secondsLeft;
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function GuidedSession({ exercises, onComplete }) {
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [setNumber, setSetNumber] = useState(1);
  const [phase, setPhase] = useState("active"); // "active" | "resting"
  // logRef accumulates { exerciseId, setsCompleted, setsPrescribed } per exercise.
  // Using a ref (not state) avoids any race between "log the last exercise" and
  // "call onComplete" — both happen in the same synchronous call.
  const logRef = useRef([]);

  const exercise = exercises[exerciseIndex];
  const isHold = exercise.type === "hold";

  const finishExercise = useCallback(
    (setsCompleted) => {
      logRef.current = [
        ...logRef.current,
        {
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          setsCompleted,
          setsPrescribed: exercise.sets,
        },
      ];

      if (exerciseIndex + 1 >= exercises.length) {
        onComplete(logRef.current);
        return;
      }
      setExerciseIndex((i) => i + 1);
      setSetNumber(1);
      setPhase("active");
    },
    [exercise, exerciseIndex, exercises.length, onComplete]
  );

  function handleSetDone() {
    // rep-type: user tapped "Done" for the current set
    if (setNumber >= exercise.sets) {
      finishExercise(setNumber);
    } else {
      setPhase("resting");
    }
  }

  function handleHoldComplete() {
    // hold-type: countdown reached zero automatically
    if (setNumber >= exercise.sets) {
      finishExercise(setNumber);
    } else {
      setPhase("resting");
    }
  }

  function handleRestComplete() {
    setSetNumber((n) => n + 1);
    setPhase("active");
  }

  function handleSkipExercise() {
    finishExercise(0);
  }

  function handleSkipRest() {
    handleRestComplete();
  }

  const holdSecondsLeft = useCountdown(
    exercise.holdSeconds || 0,
    handleHoldComplete,
    isHold && phase === "active"
  );

  const restSecondsLeft = useCountdown(
    exercise.restSeconds || 0,
    handleRestComplete,
    phase === "resting"
  );

  return (
    <div className="session-screen">
      <div className="session-topbar">
        <span className="session-progress">
          Exercise {exerciseIndex + 1} of {exercises.length}
        </span>
      </div>

      <div className="session-card">
        <h1 className="session-exercise-name">{exercise.name}</h1>
        <p className="session-form-cue">{exercise.formCue}</p>

        {phase === "active" && (
          <>
            <p className="session-set-label">
              Set {setNumber} of {exercise.sets}
            </p>

            {isHold ? (
              <>
                <div className="session-big-number session-big-number--hold">
                  {formatTime(holdSecondsLeft)}
                </div>
                <p className="session-hint">Counting down automatically</p>
              </>
            ) : (
              <>
                <div className="session-big-number">{exercise.reps} reps</div>
                <p className="session-hint">Tap done when finished</p>
                <button className="session-primary-btn" onClick={handleSetDone}>
                  Done
                </button>
              </>
            )}
          </>
        )}

        {phase === "resting" && (
          <>
            <p className="session-set-label">Rest before set {setNumber + 1} of {exercise.sets}</p>
            <div className="session-big-number session-big-number--rest">
              {formatTime(restSecondsLeft)}
            </div>
            <p className="session-hint">Next set starts automatically</p>
            <button className="session-secondary-btn" onClick={handleSkipRest}>
              Skip rest
            </button>
          </>
        )}
      </div>

      <div className="session-bottom-actions">
        <button className="session-skip-btn" onClick={handleSkipExercise}>
          Skip exercise
        </button>
      </div>
    </div>
  );
}

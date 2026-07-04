import { useState, useCallback } from "react";
import GuidedSession from "./components/GuidedSession";
import SessionSummary from "./components/SessionSummary";
import TodayScreen from "./components/TodayScreen";
import VisitUpdate from "./components/VisitUpdate";
import {
  getTodaysExercises,
  saveSession,
  loadSessions,
  computeStreak,
  computeWeekAdherence,
  sessionCompletionLevel,
} from "./data/storage";
import "./App.css";

function loadTodayData() {
  const exercises = getTodaysExercises();
  const sessions = loadSessions();
  return {
    exercises,
    streak: computeStreak(sessions),
    weekAdherence: computeWeekAdherence(sessions),
  };
}

export default function App() {
  const [screen, setScreen] = useState("today");
  const [todayData, setTodayData] = useState(() => loadTodayData());
  const [summaryData, setSummaryData] = useState(null);

  const refreshToday = useCallback(() => {
    setTodayData(loadTodayData());
  }, []);

  function handleStartSession() {
    setScreen("session");
  }

  function handleComplete(entries) {
    const session = saveSession(entries);
    const allSessions = loadSessions();
    const streak = computeStreak(allSessions);
    const weekAdherence = computeWeekAdherence(allSessions);
    const completionLevel = sessionCompletionLevel(entries);
    setSummaryData({ session, streak, weekAdherence, completionLevel });
    setScreen("summary");
  }

  function handleSummaryDone() {
    setSummaryData(null);
    refreshToday();
    setScreen("today");
  }

  function handleUpdatePlan() {
    setScreen("visit");
  }

  function handleVisitDone() {
    refreshToday();
    setScreen("today");
  }

  if (screen === "session") {
    return (
      <GuidedSession
        exercises={todayData.exercises}
        onComplete={handleComplete}
      />
    );
  }

  if (screen === "summary" && summaryData) {
    return (
      <SessionSummary
        session={summaryData.session}
        streak={summaryData.streak}
        weekAdherence={summaryData.weekAdherence}
        completionLevel={summaryData.completionLevel}
        onDone={handleSummaryDone}
      />
    );
  }

  if (screen === "visit") {
    return <VisitUpdate onDone={handleVisitDone} />;
  }

  return (
    <TodayScreen
      exercises={todayData.exercises}
      streak={todayData.streak}
      weekAdherence={todayData.weekAdherence}
      onStartSession={handleStartSession}
      onUpdatePlan={handleUpdatePlan}
    />
  );
}

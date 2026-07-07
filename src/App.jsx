import { useState, useCallback } from "react";
import GuidedSession from "./components/GuidedSession";
import SessionSummary from "./components/SessionSummary";
import TodayScreen from "./components/TodayScreen";
import VisitUpdate from "./components/VisitUpdate";
import TrendsScreen from "./components/TrendsScreen";
import PDFUpload from "./components/PDFUpload";
import {
  getTodaysExercises,
  loadActiveExercises,
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

function getInitialScreen() {
  // Show PDF upload on first launch if no exercises exist yet
  const hasExercises = loadActiveExercises().length > 0;
  return hasExercises ? "today" : "pdf";
}

export default function App() {
  const [screen, setScreen] = useState(getInitialScreen);
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

  function handleViewTrends() {
    setScreen("trends");
  }

  function handleTrendsBack() {
    setScreen("today");
  }

  function handlePDFDone() {
    refreshToday();
    setScreen("today");
  }

  function handleImportPDF() {
    setScreen("pdf");
  }

  if (screen === "pdf") {
    return <PDFUpload onDone={handlePDFDone} />;
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
    return <VisitUpdate onDone={handleVisitDone} onImportPDF={handleImportPDF} />;
  }

  if (screen === "trends") {
    return <TrendsScreen onBack={handleTrendsBack} />;
  }

  return (
    <TodayScreen
      exercises={todayData.exercises}
      streak={todayData.streak}
      weekAdherence={todayData.weekAdherence}
      onStartSession={handleStartSession}
      onUpdatePlan={handleUpdatePlan}
      onViewTrends={handleViewTrends}
      onImportPDF={handleImportPDF}
    />
  );
}

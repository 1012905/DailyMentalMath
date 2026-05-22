import { createSignal, createEffect, onCleanup } from "solid-js";
import { randInt, formatAnswer, generateQuestion } from "../lib/math.js";

/* ── seeded PRNG (mulberry32) for daily challenges ── */
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getDailySeed() {
  const now = new Date();
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

/* ── deterministic question for daily challenge ── */
/* ── localStorage helpers ── */
const ERRORS_KEY = "dmm-error-bank";
const STATS_KEY = "dmm-stats-history";
const ACHV_KEY = "dmm-achievements";
const STREAK_KEY = "dmm-streak-days";

function loadJSON(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function saveJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

export function loadErrorBank() {
  return loadJSON(ERRORS_KEY, []);
}

export function loadStatsHistory() {
  return loadJSON(STATS_KEY, []);
}

export function loadAchievements() {
  return loadJSON(ACHV_KEY, []);
}

export function loadStreakDays() {
  return loadJSON(STREAK_KEY, []);
}

function getExplanation(q) {
  const { a, b, op, answer, hint, display } = q;
  const ans = formatAnswer(answer);
  // Special types
  if (op === "补") return `100 - ${a} = ${ans}，因为 ${a} + ${ans} = 100`;
  if (op === "+...") return display ? `${display} = ${ans}` : `${a} + ... = ${ans}`;
  if (op === "±") return display ? `${display} = ${ans}` : `${a} ± ... = ${ans}`;
  if (op === "≈") return `${display || (a+' × '+b)} ≈ ${ans}${hint ? '（' + hint + '）' : ''}`;
  // Standard operators
  switch (op) {
    case "+": return `${a} + ${b} = ${ans}，因为 ${a} 加 ${b} 等于 ${ans}`;
    case "-": return `${a} - ${b} = ${ans}，因为 ${b} 加 ${ans} 等于 ${a}`;
    case "×": return `${a} × ${b} = ${ans}，因为 ${a} 个 ${b} 相加等于 ${ans}`;
    case "÷": return `${a} ÷ ${b} = ${ans}，因为 ${b} × ${ans} = ${a}`;
    default: return `${a} ${op} ${b} = ${ans}`;
  }
}

export default function usePractice() {
  const [mode, setMode] = createSignal("idle"); // idle | free | timed | daily | error-review
  const [question, setQuestion] = createSignal(null);
  const [index, setIndex] = createSignal(0);
  const [total, setTotal] = createSignal(0);
  const [streak, setStreak] = createSignal(0);
  const [maxStreak, setMaxStreak] = createSignal(0);
  const [answered, setAnswered] = createSignal(0);
  const [correct, setCorrect] = createSignal(0);
  const [totalTime, setTotalTime] = createSignal(0);
  const [minTime, setMinTime] = createSignal(Infinity);
  const [maxTime, setMaxTime] = createSignal(-Infinity);
  const [feedbackText, setFeedbackText] = createSignal("");
  const [feedbackType, setFeedbackType] = createSignal(null);
  const [inputDisabled, setInputDisabled] = createSignal(false);
  const [submitDisabled, setSubmitDisabled] = createSignal(false);
  const [nextDisabled, setNextDisabled] = createSignal(true);
  const [answerValue, setAnswerValue] = createSignal("");
  const [isFinished, setIsFinished] = createSignal(false);
  const [timeLeft, setTimeLeft] = createSignal(60);
  const [history, setHistory] = createSignal([]);
  const [wrongQuestions, setWrongQuestions] = createSignal([]);
  const [explanation, setExplanation] = createSignal("");
  const [streakFireLevel, setStreakFireLevel] = createSignal(0);
  const [showConfetti, setShowConfetti] = createSignal(false);

  let questionStart = 0;
  let timerId = null;

  // ── helpers ──
    function clearTimer() {
    if (timerId) { clearInterval(timerId); timerId = null; }
  }

  // ── generate next question ──
  function generateNext(typeArg, rng) {
    const type = typeArg || "two-digit-addsub";
    if (rng) {
      // Daily mode: wrap Math.random with seeded PRNG for deterministic questions
      const _rand = Math.random;
      Math.random = rng;
      const q = generateQuestion(type);
      Math.random = _rand;
      return q;
    }
    return generateQuestion(type);
  }

  // ── start practice ──
  function startPractice(newMode, opts = {}) {
    clearTimer();
    const type = opts.questionType || localStorage.getItem("dmm-type") || "two-digit-addsub";

    setMode(newMode);
    setIndex(0);
    setStreak(0);
    setMaxStreak(0);
    setAnswered(0);
    setCorrect(0);
    setTotalTime(0);
    setMinTime(Infinity);
    setMaxTime(-Infinity);
    setFeedbackText("");
    setFeedbackType(null);
    setInputDisabled(false);
    setSubmitDisabled(false);
    setNextDisabled(true);
    setAnswerValue("");
    setIsFinished(false);
    setHistory([]);
    setWrongQuestions([]);
    setExplanation("");
    setStreakFireLevel(0);
    setShowConfetti(false);

    if (newMode === "timed") {
      setTimeLeft(60);
      const count = opts.count || 0;
      setTotal(count > 0 ? count : 9999);
      // start countdown
      timerId = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) { clearTimer(); endSession(); return 0; }
          return t - 1;
        });
      }, 1000);
    } else if (newMode === "daily") {
      setTotal(20);
    } else if (newMode === "error-review") {
      const bank = loadErrorBank();
      const lastSession = bank.length > 0 ? bank[bank.length - 1] : null;
      const errors = lastSession ? [...lastSession.errors] : [];
      setWrongQuestions(errors);
      setTotal(errors.length);
      if (errors.length === 0) {
        setFeedbackText("🎉 No errors from last session!");
        setIsFinished(true);
        return;
      }
    } else {
      // free mode
      setTotal(opts.count || 10);
    }

    showNextQuestion(type);
  }

  // ── show next question ──
  function showNextQuestion(type) {
    const q = mode() === "error-review"
      ? pickErrorQuestion()
      : mode() === "daily"
        ? generateNext(type, mulberry32(getDailySeed() + index()))
        : generateNext(type, null);

    if (!q) { endSession(); return; }
    setQuestion(q);
    questionStart = performance.now();
    setAnswerValue("");
    setInputDisabled(false);
    setSubmitDisabled(false);
    setNextDisabled(true);
    setFeedbackText("");
    setFeedbackType(null);
    setExplanation("");
  }

  // ── pick from error review queue ──
  function pickErrorQuestion() {
    const remaining = wrongQuestions();
    if (remaining.length === 0) return null;
    const idx = Math.floor(Math.random() * remaining.length);
    const err = remaining[idx];
    const display = err.display || `${err.a} ${err.op} ${err.b}`;
    return { a: err.a, b: err.b, op: err.op, answer: err.correctAnswer, display };
  }

  // ── submit answer ──
  function submitAnswer() {
    const q = question();
    if (!q) return;
    const raw = answerValue().trim();
    if (raw === "") return;
    if (inputDisabled()) return;

    const elapsed = (performance.now() - questionStart) / 1000;
    const userAns = parseFloat(raw);
    const isCorrect = !isNaN(userAns) && Math.abs(userAns - q.answer) < 0.001;

    setAnswered((v) => v + 1);
    if (isCorrect) {
      setCorrect((v) => v + 1);
      setStreak((v) => {
        const newStreak = v + 1;
        setMaxStreak((mv) => Math.max(mv, newStreak));
        // fire level: streak / 5, capped at 4
        setStreakFireLevel(Math.min(Math.floor(newStreak / 5), 4));
        return newStreak;
      });
    } else {
      setStreak(0);
      setStreakFireLevel(0);
      if (mode() === "timed") {
        setTimeLeft((t) => Math.max(0, t - 2));
      }
      // Store wrong question for error bank
      const wrongQ = { a: q.a, b: q.b, op: q.op, userAnswer: userAns, correctAnswer: q.answer };
      setWrongQuestions((prev) => [...prev, wrongQ]);

      // Show explanation
      setExplanation(getExplanation(q));
    }

    setTotalTime((v) => v + elapsed);
    if (elapsed < minTime()) setMinTime(elapsed);
    if (elapsed > maxTime()) setMaxTime(elapsed);

    setHistory((prev) => [
      ...prev,
      {
        question: q.display || `${q.a} ${q.op} ${q.b}`,
        userAns: isNaN(userAns) ? raw : userAns,
        correctAns: q.answer,
        correct: isCorrect,
        elapsed,
      },
    ]);

    const answerText = formatAnswer(q.answer);
    setFeedbackText(
      isCorrect
        ? `✓ Correct! (${answerText}, ${elapsed.toFixed(2)}s)`
        : `✗ Wrong! Answer: ${answerText} (${elapsed.toFixed(2)}s)`
    );
    setFeedbackType(isCorrect ? "correct" : "wrong");

    setInputDisabled(true);
    setSubmitDisabled(true);
    setNextDisabled(false);
    setIndex((v) => v + 1);
  }

  // ── next question ──
  function nextQuestion() {
    const type = localStorage.getItem("dmm-type") || "two-digit-addsub";
    if (index() >= total() && mode() !== "free") {
      endSession();
      return;
    }
    showNextQuestion(type);
  }

  // ── end session ──
  function endSession() {
    clearTimer();
    setInputDisabled(true);
    setSubmitDisabled(true);
    setNextDisabled(true);
    setIsFinished(true);

    // Save stats
    const acc = answered() > 0 ? correct() / answered() : 0;
    const newStat = {
      date: Date.now(),
      mode: mode(),
      total: answered(),
      correct: correct(),
      accuracy: acc,
      avgTime: answered() > 0 ? totalTime() / answered() : 0,
      maxStreak: maxStreak(),
    };
    const stats = loadStatsHistory();
    stats.push(newStat);
    saveJSON(STATS_KEY, stats.slice(-15));

    // Save errors
    const wrong = wrongQuestions();
    if (wrong.length > 0) {
      const bank = loadErrorBank();
      bank.push({ session: Date.now(), errors: wrong });
      saveJSON(ERRORS_KEY, bank.slice(-3));
    }

    // Check achievements
    checkAchievements(newStat, wrong.length);

    // Confetti on high accuracy
    if (acc > 0.9 && answered() >= 5) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2500);
    }

    // Save daily challenge streak
    if (mode() === "daily" && acc === 1) {
      const days = loadStreakDays();
      const today = new Date().toISOString().slice(0, 10);
      if (!days.includes(today)) {
        days.push(today);
        saveJSON(STREAK_KEY, days);
      }
    }
  }

  // ── achievements ──
  function checkAchievements(stat, wrongCount) {
    const unlocked = loadAchievements();
    const now = Date.now();
    const newUnlocks = [];

    const unlock = (id) => {
      if (!unlocked.find((a) => a.id === id)) {
        unlocked.push({ id, unlockedAt: now });
        newUnlocks.push(id);
      }
    };

    // 全对王: 100% accuracy && >= 10 questions
    if (stat.accuracy === 1 && stat.total >= 10) unlock("perfectionist");
    // 稳如泰山: streak >= 20
    if (maxStreak() >= 20) unlock("steady");
    // 速度之星 (timed): correct >= 30 in timed mode
    if (mode() === "timed" && correct() >= 30) unlock("speed-star");
    // 闪电侠: avg time < 3s in timed mode
    if (mode() === "timed" && stat.avgTime < 3 && correct() >= 5) unlock("lightning");
    // 夜猫子: play between 23:00-05:00
    const hour = new Date().getHours();
    if (hour >= 23 || hour < 5) unlock("night-owl");
    // 完美主义: daily challenge all correct
    if (mode() === "daily" && stat.accuracy === 1 && stat.total === 20) {
      unlock("perfect-daily");
    }
    // 连胜勋章: 7 consecutive daily challenge days
    if (mode() === "daily") {
      const days = loadStreakDays();
      // Check if last 7 days are in streak
      const today = new Date();
      let streakCount = 0;
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        if (days.includes(key)) streakCount++;
        else break;
      }
      if (streakCount >= 7) unlock("streak-7");
    }
    // 收藏家: all other achievements
    const allOthers = ["perfectionist", "steady", "speed-star", "lightning", "night-owl", "perfect-daily", "streak-7"];
    if (allOthers.every((id) => unlocked.find((a) => a.id === id))) {
      unlock("collector");
    }

    if (newUnlocks.length > 0) {
      saveJSON(ACHV_KEY, unlocked);
    }
    return newUnlocks;
  }

  // ── retry errors from last session ──
  function retryErrors() {
    startPractice("error-review");
  }

  // ── cleanup ──
  onCleanup(() => clearTimer());

  return {
    // state
    mode,
    question,
    index,
    total,
    streak,
    maxStreak,
    answered,
    correct,
    totalTime,
    minTime,
    maxTime,
    feedbackText,
    feedbackType,
    inputDisabled,
    submitDisabled,
    nextDisabled,
    answerValue,
    isFinished,
    timeLeft,
    history,
    wrongQuestions,
    explanation,
    streakFireLevel,
    showConfetti,
    // methods
    setAnswerValue,
    startPractice,
    submitAnswer,
    nextQuestion,
    endSession,
    retryErrors,
  };
}

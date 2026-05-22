"use strict";

export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function formatAnswer(ans) {
  if (typeof ans !== "number") return String(ans);
  // 避免浮点误差
  const rounded = Math.round(ans * 1000) / 1000;
  if (Math.abs(rounded - Math.round(rounded)) < 0.001) return String(Math.round(rounded));
  return rounded.toFixed(2);
}

export function formatTime(sec) {
  return sec.toFixed(2);
}

/* ── 题型配置 ── */
export const QUESTION_TYPES = [
  { id: "two-digit-addsub",  labelKey: "typeTwoDigitAddSub",  group: "basic" },
  { id: "make-100",          labelKey: "typeMake100",         group: "basic" },
  { id: "three-digit-add",   labelKey: "typeThreeDigitAdd",   group: "adv" },
  { id: "three-digit-sub",   labelKey: "typeThreeDigitSub",   group: "adv" },
  { id: "three-digit-addsub",labelKey: "typeThreeDigitAddSub",group: "adv" },
  { id: "multi-add",         labelKey: "typeMultiAdd",        group: "adv" },
  { id: "mixed-addsub",      labelKey: "typeMixedAddSub",     group: "adv" },
  { id: "two-digit-x-one",   labelKey: "typeTwoDigitXOne",    group: "mult" },
  { id: "three-digit-x-one", labelKey: "typeThreeDigitXOne",  group: "mult" },
  { id: "two-digit-x-11",    labelKey: "typeTwoDigitX11",     group: "mult" },
  { id: "two-digit-x-15",    labelKey: "typeTwoDigitX15",     group: "mult" },
  { id: "two-digit-x-two",   labelKey: "typeTwoDigitXTwo",    group: "mult" },
  { id: "three-digit-div-one",  labelKey: "typeThreeDigitDivOne",  group: "div" },
  { id: "three-digit-div-two",  labelKey: "typeThreeDigitDivTwo",  group: "div" },
  { id: "mult-estimate",     labelKey: "typeMultEstimate",    group: "adv" },
  { id: "five-digit-div-three", labelKey: "typeFiveDigitDivThree", group: "div" },
  { id: "three-digit-div-four", labelKey: "typeThreeDigitDivFour", group: "div" },
];

// 题型分组
export const TYPE_GROUPS = [
  { id: "basic", labelKey: "groupBasic" },
  { id: "adv",   labelKey: "groupAdv" },
  { id: "mult",  labelKey: "groupMult" },
  { id: "div",   labelKey: "groupDiv" },
];

/* ── 根据题型 ID 生成题目 ── */
export function generateQuestion(typeId) {
  switch (typeId) {
    case "two-digit-addsub": return genTwoDigitAddSub();
    case "make-100":         return genMake100();
    case "three-digit-add":  return genThreeDigitAdd();
    case "three-digit-sub":  return genThreeDigitSub();
    case "three-digit-addsub": return genThreeDigitAddSub();
    case "multi-add":        return genMultiAdd();
    case "mixed-addsub":     return genMixedAddSub();
    case "two-digit-x-one":  return genTwoDigitXOne();
    case "three-digit-x-one":return genThreeDigitXOne();
    case "two-digit-x-11":   return genTwoDigitX11();
    case "two-digit-x-15":   return genTwoDigitX15();
    case "two-digit-x-two":  return genTwoDigitXTwo();
    case "three-digit-div-one":  return genThreeDigitDivOne();
    case "three-digit-div-two":  return genThreeDigitDivTwo();
    case "mult-estimate":    return genMultEstimate();
    case "five-digit-div-three": return genFiveDigitDivThree();
    case "three-digit-div-four": return genThreeDigitDivFour();
    default: return genTwoDigitAddSub(); // fallback
  }
}

/* ── 1. 两位数加减 ── */
function genTwoDigitAddSub() {
  const op = Math.random() < 0.5 ? "+" : "-";
  let a = randInt(10, 99), b = randInt(10, 99);
  if (op === "-" && a < b) [a, b] = [b, a];
  const answer = op === "+" ? a + b : a - b;
  return { display: `${a} ${op} ${b}`, a, b, op, answer };
}

/* ── 2. 凑整百练习 ── */
function genMake100() {
  const a = randInt(1, 99);
  const answer = 100 - a;
  return { display: `${a} + ? = 100`, a, b: null, op: "补", answer, hint: `100 - ${a}` };
}

/* ── 3. 三位数加法 ── */
function genThreeDigitAdd() {
  const a = randInt(100, 999), b = randInt(100, 999);
  return { display: `${a} + ${b}`, a, b, op: "+", answer: a + b };
}

/* ── 4. 三位数减法 ── */
function genThreeDigitSub() {
  let a = randInt(100, 999), b = randInt(100, 999);
  if (a < b) [a, b] = [b, a];
  return { display: `${a} - ${b}`, a, b, op: "-", answer: a - b };
}

/* ── 5. 三位数加减 ── */
function genThreeDigitAddSub() {
  return Math.random() < 0.5 ? genThreeDigitAdd() : genThreeDigitSub();
}

/* ── 6. 多数相加 ── */
function genMultiAdd() {
  const count = randInt(3, 5);
  const nums = Array.from({ length: count }, () => randInt(1, 100));
  const sum = nums.reduce((s, n) => s + n, 0);
  const display = nums.join(" + ");
  return { display, a: nums[0], b: nums[1], op: "+...", answer: sum, multiNums: nums };
}

/* ── 7. 混合加减 ── */
function genMixedAddSub() {
  const count = randInt(3, 5);
  const nums = [randInt(10, 999)];
  const ops = [];
  for (let i = 1; i < count; i++) {
    const op = Math.random() < 0.5 ? "+" : "-";
    const n = randInt(1, i < 3 ? 99 : 999);
    ops.push(op);
    nums.push(n);
  }
  let result = nums[0];
  let display = String(nums[0]);
  for (let i = 1; i < nums.length; i++) {
    if (ops[i - 1] === "+") result += nums[i];
    else result -= nums[i];
    display += ` ${ops[i-1]} ${nums[i]}`;
  }
  return { display, a: nums[0], b: nums[1], op: "±", answer: result, multiOps: ops, multiNums: nums };
}

/* ── 8. 两位数 × 一位数 ── */
function genTwoDigitXOne() {
  const a = randInt(10, 99), b = randInt(2, 9);
  return { display: `${a} × ${b}`, a, b, op: "×", answer: a * b };
}

/* ── 9. 三位数 × 一位数 ── */
function genThreeDigitXOne() {
  const a = randInt(100, 999), b = randInt(2, 9);
  return { display: `${a} × ${b}`, a, b, op: "×", answer: a * b };
}

/* ── 10. 两位数 × 11 ── */
function genTwoDigitX11() {
  const a = randInt(10, 99);
  // ×11 规律: 23×11=253 (2, 2+3=5, 3)
  return { display: `${a} × 11`, a, b: 11, op: "×", answer: a * 11, hint: `${a}×11 = ${a}×10 + ${a}` };
}

/* ── 11. 两位数 × 15 ── */
function genTwoDigitX15() {
  const a = randInt(10, 99);
  return { display: `${a} × 15`, a, b: 15, op: "×", answer: a * 15, hint: `${a}×15 = ${a}×10 + ${a}×5` };
}

/* ── 12. 两位数 × 两位数 ── */
function genTwoDigitXTwo() {
  const a = randInt(10, 99), b = randInt(10, 99);
  return { display: `${a} × ${b}`, a, b, op: "×", answer: a * b };
}

/* ── 13. 三位数 ÷ 一位数 ── */
function genThreeDigitDivOne() {
  const b = randInt(2, 9);
  const k = randInt(11, 99); // 结果
  const a = b * k; // 被除数
  return { display: `${a} ÷ ${b}`, a, b, op: "÷", answer: k };
}

/* ── 14. 三位数 ÷ 两位数 ── */
function genThreeDigitDivTwo() {
  const b = randInt(10, 49);
  const k = randInt(2, 9); // 结果
  const a = b * k;
  return { display: `${a} ÷ ${b}`, a, b, op: "÷", answer: k };
}

/* ── 15. 乘法估算 ── */
function genMultEstimate() {
  const a = randInt(12, 999), b = randInt(12, 999);
  const roundTo = (n) => {
    if (n < 100) return Math.round(n / 10) * 10;
    return Math.round(n / 100) * 100;
  };
  const aRound = roundTo(a), bRound = roundTo(b);
  return {
    display: `${a} × ${b} ≈`,
    a, b, op: "≈",
    answer: aRound * bRound,
    hint: `${aRound} × ${bRound}`,
    exactAnswer: a * b,
  };
}

/* ── 16. 五位数 ÷ 三位数 ── */
function genFiveDigitDivThree() {
  const b = randInt(100, 999);
  const k = randInt(10, 99); // 结果
  const a = b * k;
  return { display: `${a} ÷ ${b}`, a, b, op: "÷", answer: k };
}

/* ── 17. 三位数 ÷ 四位数（结果为小数） ── */
function genThreeDigitDivFour() {
  const k = randInt(1, 50); // 倍数
  const b = randInt(100, 999); // 除数（三位数）
  const a = b * k; // 被除数（四位数）
  // 确保 a 是四位数
  if (a < 1000 || a > 9999) return genThreeDigitDivFour();
  return { display: `${a} ÷ ${b}`, a, b, op: "÷", answer: k };
}

/* ── 传统的运算符模式（保留兼容性） ── */
export function generateQuestionOld(ops) {
  if (ops.length === 0) return null;
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a, b, answer;
  if (op === "÷") {
    b = randInt(1, 100);
    const maxMul = Math.floor(100 / b);
    a = b * randInt(1, maxMul);
    answer = a / b;
  } else if (op === "×") {
    a = randInt(1, 100);
    b = randInt(1, Math.min(100, Math.floor(100 / a)));
    answer = a * b;
  } else {
    a = randInt(1, 100);
    b = randInt(1, 100);
    if (op === "-" && a < b) [a, b] = [b, a];
    answer = op === "+" ? a + b : a - b;
  }
  return { display: `${a} ${op} ${b}`, a, b, op, answer };
}

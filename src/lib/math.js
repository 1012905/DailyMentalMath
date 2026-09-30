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
  // 生成过程必须保证每一步中间结果非负：
  // 否则会出现「10 - 99 - 99 = -188」这类负数题，超出心算练习范围。
  for (let attempt = 0; attempt < 50; attempt++) {
    const count = randInt(3, 5);
    const nums = [randInt(10, 999)];
    const ops = [];
    for (let i = 1; i < count; i++) {
      ops.push(Math.random() < 0.5 ? "+" : "-");
      nums.push(randInt(1, i < 3 ? 99 : 999));
    }
    let result = nums[0];
    let display = String(nums[0]);
    let valid = true;
    for (let i = 1; i < nums.length; i++) {
      if (ops[i - 1] === "+") result += nums[i];
      else result -= nums[i];
      if (result < 0) { valid = false; break; }
      display += ` ${ops[i - 1]} ${nums[i]}`;
    }
    if (!valid) continue;
    return { display, a: nums[0], b: nums[1], op: "±", answer: result, multiOps: ops, multiNums: nums };
  }
  // 兜底：极小概率连续 50 次失败时，退化为一个必然合法的加法题
  const a = randInt(10, 99), b = randInt(10, 99);
  return { display: `${a} + ${b}`, a, b, op: "+", answer: a + b };
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
  // 结果保持一位数（心算友好），先定除数 b，再从 b 能取到的商区间里抽 k，
  // 使 b × k 落在 [100, 999] 内 —— 该区间对 b ∈ [2,9] 恒非空，不会死循环。
  const b = randInt(2, 9);
  const kMin = Math.max(2, Math.ceil(100 / b));
  const kMax = Math.min(9, Math.floor(999 / b));
  const k = randInt(kMin, Math.max(kMin, kMax));
  const a = b * k;
  return { display: `${a} ÷ ${b}`, a, b, op: "÷", answer: k };
}

/* ── 14. 三位数 ÷ 两位数 ── */
function genThreeDigitDivTwo() {
  // 除数与商都保持较小（心算友好），乘积必然落在三位数区间
  const b = randInt(10, 20);
  const k = randInt(5, 9);
  const a = b * k;                 // ∈ [50, 180]
  if (a >= 100 && a <= 999) {
    return { display: `${a} ÷ ${b}`, a, b, op: "÷", answer: k };
  }
  // a < 100 时把商抬到刚好进入三位数
  const k2 = Math.ceil(100 / b);   // b ∈ [10,20] → k2 ∈ [5,10]
  const a2 = b * k2;
  return { display: `${a2} ÷ ${b}`, a: a2, b, op: "÷", answer: k2 };
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
  // 保证被除数是五位数 [10000, 99999]
  const k = randInt(Math.ceil(10000 / b), Math.floor(99999 / b));
  if (k < 2) return genFiveDigitDivThree();
  const a = b * k;
  if (a < 10000 || a > 99999) return genFiveDigitDivThree();
  return { display: `${a} ÷ ${b}`, a, b, op: "÷", answer: k };
}

/* ── 17. 四位数 ÷ 三位数（整除） ── */
function genThreeDigitDivFour() {
  const b = randInt(100, 999); // 除数（三位数）
  // 保证被除数是四位数 [1000, 9999]
  const kMin = Math.ceil(1000 / b), kMax = Math.floor(9999 / b);
  if (kMax < kMin) return genThreeDigitDivFour();
  const k = randInt(kMin, kMax);
  const a = b * k;
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

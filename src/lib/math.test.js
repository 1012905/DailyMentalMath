import { describe, it, expect } from "vitest";
import { randInt, formatAnswer, formatTime, generateQuestion, TYPE_GROUPS, QUESTION_TYPES } from "./math.js";

describe("randInt", () => {
  it("returns an integer within range", () => {
    for (let i = 0; i < 100; i++) {
      const r = randInt(1, 6);
      expect(r).toBeGreaterThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(6);
      expect(Number.isInteger(r)).toBe(true);
    }
  });
  it("handles single-value range", () => {
    expect(randInt(5, 5)).toBe(5);
  });
});

describe("formatAnswer", () => {
  it("shows integers without decimals", () => {
    expect(formatAnswer(42)).toBe("42");
    expect(formatAnswer(0)).toBe("0");
  });
  it("shows 2 decimals for non-integers", () => {
    expect(formatAnswer(3.14159)).toBe("3.14");
    expect(formatAnswer(1.5)).toBe("1.50");
  });
  it("rounds near-integers to integer", () => {
    expect(formatAnswer(3.0005)).toBe("3");
    expect(formatAnswer(2.9999)).toBe("3");
  });
});

describe("formatTime", () => {
  it("formats seconds with 2 decimal places", () => {
    expect(formatTime(3.5)).toBe("3.50");
    expect(formatTime(0)).toBe("0.00");
    expect(formatTime(12.345)).toBe("12.35");
  });
});

describe("QUESTION_TYPES", () => {
  it("has 17 question types", () => {
    expect(QUESTION_TYPES.length).toBe(17);
  });
  it("each type has an id and labelKey", () => {
    for (const t of QUESTION_TYPES) {
      expect(t.id).toBeTruthy();
      expect(t.labelKey).toBeTruthy();
      expect(t.group).toBeTruthy();
    }
  });
});

describe("TYPE_GROUPS", () => {
  it("has 4 groups (basic, adv, mult, div)", () => {
    expect(TYPE_GROUPS).toHaveLength(4);
    expect(TYPE_GROUPS.map((g) => g.id).sort()).toEqual(["adv", "basic", "div", "mult"]);
  });
});

describe("generateQuestion", () => {
  it("generates a valid question for each type", () => {
    for (const { id } of QUESTION_TYPES) {
      const q = generateQuestion(id);
      expect(q).toBeTruthy();
      expect(q.display).toBeTruthy();
      expect(typeof q.answer).toBe("number");
      expect(Number.isFinite(q.answer)).toBe(true);
    }
  });

  it("two-digit-addsub: answer within expected range", () => {
    for (let i = 0; i < 50; i++) {
      const q = generateQuestion("two-digit-addsub");
      expect(q.a).toBeGreaterThanOrEqual(10);
      expect(q.a).toBeLessThanOrEqual(99);
      expect(q.b).toBeGreaterThanOrEqual(10);
      expect(q.b).toBeLessThanOrEqual(99);
      if (q.op === "-") expect(q.answer).toBeGreaterThanOrEqual(0);
    }
  });

  it("make-100: answer is 100 - a", () => {
    for (let i = 0; i < 20; i++) {
      const q = generateQuestion("make-100");
      expect(q.a).toBeGreaterThanOrEqual(1);
      expect(q.a).toBeLessThanOrEqual(99);
      expect(q.answer).toBe(100 - q.a);
    }
  });

  it("two-digit-x-11: answer = a * 11", () => {
    for (let i = 0; i < 20; i++) {
      const q = generateQuestion("two-digit-x-11");
      expect(q.a).toBeGreaterThanOrEqual(10);
      expect(q.a).toBeLessThanOrEqual(99);
      expect(q.answer).toBe(q.a * 11);
    }
  });

  it("three-digit-div-one: division result is exact integer", () => {
    for (let i = 0; i < 20; i++) {
      const q = generateQuestion("three-digit-div-one");
      expect(q.b).toBeGreaterThanOrEqual(2);
      expect(q.b).toBeLessThanOrEqual(9);
      expect(q.answer).toBe(q.a / q.b);
    }
  });

  it("mult-estimate: answer is rounded estimate", () => {
    for (let i = 0; i < 20; i++) {
      const q = generateQuestion("mult-estimate");
      expect(q.op).toBe("≈");
      expect(q.hint).toBeTruthy();
      // exactAnswer should be the real product
      expect(q.exactAnswer).toBe(q.a * q.b);
    }
  });

  it("falls back to two-digit-addsub for unknown type", () => {
    const q = generateQuestion("non-existent-type");
    expect(q).toBeTruthy();
    expect(["+", "-"]).toContain(q.op);
  });

  /* ── 回归测试：以下 4 条对应真实修过的 bug，不要删除 ── */

  it("mixed-addsub: 每一步中间结果都非负（曾产生 10 - 99 - 99 = -188）", () => {
    for (let i = 0; i < 500; i++) {
      const q = generateQuestion("mixed-addsub");
      expect(q.answer).toBeGreaterThanOrEqual(0);
      // 逐步重算，确认中间结果也不为负
      let acc = q.multiNums[0];
      expect(acc).toBeGreaterThanOrEqual(0);
      for (let j = 0; j < q.multiOps.length; j++) {
        acc = q.multiOps[j] === "+" ? acc + q.multiNums[j + 1] : acc - q.multiNums[j + 1];
        expect(acc).toBeGreaterThanOrEqual(0);
      }
      expect(acc).toBe(q.answer);
    }
  });

  it("three-digit-div-one: 被除数为三位数、除数一位数、整除（曾无限递归爆栈）", () => {
    for (let i = 0; i < 500; i++) {
      const q = generateQuestion("three-digit-div-one");
      expect(q.a).toBeGreaterThanOrEqual(100);
      expect(q.a).toBeLessThanOrEqual(999);
      expect(q.b).toBeGreaterThanOrEqual(2);
      expect(q.b).toBeLessThanOrEqual(9);
      expect(q.a % q.b).toBe(0);
      expect(q.answer).toBe(q.a / q.b);
    }
  });

  it("three-digit-div-two: 被除数为三位数、整除（曾出现 20 ÷ 10）", () => {
    for (let i = 0; i < 500; i++) {
      const q = generateQuestion("three-digit-div-two");
      expect(q.a).toBeGreaterThanOrEqual(100);
      expect(q.a).toBeLessThanOrEqual(999);
      expect(q.b).toBeGreaterThanOrEqual(10);
      expect(q.a % q.b).toBe(0);
      expect(q.answer).toBe(q.a / q.b);
    }
  });

  it("位数类题型：被除数位数与题型名一致", () => {
    for (let i = 0; i < 500; i++) {
      const q4 = generateQuestion("three-digit-div-four");   // 四位数 ÷ 三位数
      expect(q4.a).toBeGreaterThanOrEqual(1000);
      expect(q4.a).toBeLessThanOrEqual(9999);
      expect(q4.b).toBeGreaterThanOrEqual(100);
      expect(q4.b).toBeLessThanOrEqual(999);
      expect(q4.a % q4.b).toBe(0);

      const q5 = generateQuestion("five-digit-div-three");   // 五位数 ÷ 三位数
      expect(q5.a).toBeGreaterThanOrEqual(10000);
      expect(q5.a).toBeLessThanOrEqual(99999);
      expect(q5.b).toBeGreaterThanOrEqual(100);
      expect(q5.b).toBeLessThanOrEqual(999);
      expect(q5.a % q5.b).toBe(0);
    }
  });

  it("全部 17 种题型都不会抛异常（含爆栈回归）", () => {
    for (const { id } of QUESTION_TYPES) {
      for (let i = 0; i < 100; i++) {
        const q = generateQuestion(id);
        expect(Number.isFinite(q.answer)).toBe(true);
      }
    }
  });
});

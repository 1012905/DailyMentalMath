import { describe, it, expect } from "vitest";
import { randInt, formatAnswer, formatTime } from "./math.js";

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

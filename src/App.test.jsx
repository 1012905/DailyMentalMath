// @vitest-environment jsdom
/**
 * 回车流（提交 → 再回车切题）与「重置历史记录」的组件级冒烟测试。
 *
 * 为什么值得有：回车监听挂在 document 上，输入框 disabled 后焦点会落回 body，
 * 只靠肉眼/构建都发现不了「第二下回车没反应」这种回归。
 */
import { describe, it, expect, afterEach } from "vitest";
import { render } from "solid-js/web";
import App from "./App.jsx";

/* jsdom 没有 matchMedia：useTheme 用它读系统深色偏好 */
if (typeof window.matchMedia !== "function") {
  window.matchMedia = (media) => ({
    media,
    matches: false,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  });
}

const tick = (ms = 15) => new Promise((r) => setTimeout(r, ms));

/** 轮询到条件成立（懒加载的面板是动态 import，写死 sleep 容易在慢机器上抖） */
async function waitFor(fn, timeout = 3000) {
  const t0 = Date.now();
  for (;;) {
    let v = null;
    try { v = fn(); } catch { /* DOM 还没长出来 */ }
    if (v) return v;
    if (Date.now() - t0 > timeout) throw new Error("waitFor 超时");
    await tick();
  }
}

const pressEnter = (target) =>
  target.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

const btnByText = (s) =>
  [...document.querySelectorAll("button")].find((b) => b.textContent.includes(s));

const mounted = [];
function mount() {
  const el = document.createElement("div");
  document.body.appendChild(el);
  const dispose = render(() => <App />, el);
  mounted.push({ el, dispose });
  return el;
}

afterEach(() => {
  while (mounted.length) {
    const { el, dispose } = mounted.pop();
    dispose();
    el.remove();
  }
  localStorage.clear();
});

describe("回车流", () => {
  it("第一下回车提交，答完后再回车切到下一题", async () => {
    localStorage.setItem("math-lang", "zh"); // jsdom 的 navigator 是 en，断言走中文文案
    mount();

    const start = await waitFor(() => btnByText("开始练习"));
    start.click();

    const input = await waitFor(() => document.querySelector(".answer-input"));
    input.value = "123";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    pressEnter(input); // 第一下：提交
    await waitFor(() => (input.disabled ? true : null));
    expect(document.querySelector(".feedback").textContent).toMatch(/正确|错误/);

    const q1 = document.querySelector(".question-text").textContent;
    pressEnter(document.body); // 答完题焦点已落回 body：第二下也必须收到
    await waitFor(() => (input.disabled ? null : true));

    expect(document.querySelector(".question-text").textContent).not.toBe(q1);
    expect(input.value).toBe("");
    expect(input.disabled).toBe(false);
  });
});

describe("主按钮", () => {
  it("提交与下一题是同一个按钮：作答后原地切换动作与文案", async () => {
    localStorage.setItem("math-lang", "zh");
    mount();

    const start = await waitFor(() => btnByText("开始练习"));
    start.click();

    const input = await waitFor(() => document.querySelector(".answer-input"));
    const primary = input.parentElement.querySelector("button");
    expect(primary).toBeTruthy();
    expect(primary.textContent).toContain("提交");
    // 底部只留「提前结束」，不再有第二个「下一题」
    expect(btnByText("下一题")).toBeUndefined();

    input.value = "123";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    primary.click();

    // 同一个按钮原地变成「下一题」，并且全站只有它一个
    await waitFor(() => (primary.textContent.includes("下一题") ? true : null));
    expect(document.querySelector(".feedback").textContent).toMatch(/正确|错误/);
    expect(primary.classList.contains("is-accent")).toBe(true);
    expect(
      [...document.querySelectorAll("button")].filter((b) => b.textContent.includes("下一题"))
    ).toHaveLength(1);

    // 再点同一个按钮 → 出下一题，按钮回到「提交」
    const q1 = document.querySelector(".question-text").textContent;
    primary.click();
    await waitFor(() => (primary.textContent.includes("提交") ? true : null));
    expect(document.querySelector(".question-text").textContent).not.toBe(q1);
    expect(primary.classList.contains("is-accent")).toBe(false);
  });

  it("答满后同一个按钮变成「查看结果」，点它进结果页", async () => {
    localStorage.setItem("math-lang", "zh");
    mount();

    const start = await waitFor(() => btnByText("开始练习"));
    start.click();

    const input = await waitFor(() => document.querySelector(".answer-input"));
    const primary = input.parentElement.querySelector("button");

    for (let i = 0; i < 10; i++) {
      await waitFor(() => (primary.textContent.includes("提交") ? true : null));
      input.value = String(i);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      primary.click(); // 提交

      const nextLabel = i === 9 ? "查看结果" : "下一题";
      await waitFor(() => (primary.textContent.includes(nextLabel) ? true : null));
      if (i === 9) break;
      primary.click(); // 下一题
    }

    expect(primary.textContent).toContain("查看结果");
    primary.click(); // 查看结果
    const statsTitle = await waitFor(() =>
      [...document.querySelectorAll(".section-title")].find((s) => s.textContent.includes("本轮统计"))
    );
    expect(statsTitle).toBeTruthy();
  });
});

describe("重置历史记录", () => {
  it("两步确认后清空统计，卡片随之消失", async () => {
    localStorage.setItem("math-lang", "zh");
    localStorage.setItem(
      "dmm-stats-history",
      JSON.stringify([
        { date: Date.now(), mode: "free", total: 10, correct: 9, accuracy: 0.9, avgTime: 2, maxStreak: 5 },
      ])
    );
    mount();

    const title = await waitFor(() =>
      [...document.querySelectorAll(".section-title")].find((s) => s.textContent.includes("练习统计"))
    );
    const btn = title.querySelector(".title-action");
    expect(btn.textContent).toContain("重置历史记录");

    btn.click(); // 第一下：只进入待确认态，不动数据
    await waitFor(() => (btn.textContent.includes("确认") ? true : null));
    expect(localStorage.getItem("dmm-stats-history")).toBeTruthy();

    btn.click(); // 第二下：真正清空
    await waitFor(() => (localStorage.getItem("dmm-stats-history") ? null : true));
    expect(document.querySelector(".title-action")).toBeNull();
  });

  it("没有历史记录时不显示重置按钮", async () => {
    localStorage.setItem("math-lang", "zh");
    mount();
    await waitFor(() => document.querySelector(".hero-title"));
    expect(document.querySelector(".title-action")).toBeNull();
  });
});

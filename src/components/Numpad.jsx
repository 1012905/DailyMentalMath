export default function Numpad(props) {
  const isTouchDevice = () =>
    typeof window !== "undefined" &&
    ("ontouchstart" in window || navigator.maxTouchPoints > 0);

  const handleInput = (val) => {
    if (props.disabled) return;
    if (val === "del") {
      props.onInput(props.value.slice(0, -1));
    } else if (val === ".") {
      if (!props.value.includes(".")) {
        props.onInput(props.value + ".");
      }
    } else {
      props.onInput(props.value + val);
    }
  };

  const buttons = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [".", "0", "del"],
  ];

  // Don't render on non-touch devices
  if (!isTouchDevice()) return null;

  return (
    <div class="numpad">
      {buttons.map((row) => (
        <div class="numpad-row">
          {row.map((btn) => (
            <button
              class="numpad-btn"
              classList={{ "numpad-btn-del": btn === "del", "numpad-btn-dot": btn === "." }}
              onClick={() => handleInput(btn)}
              disabled={props.disabled}
              type="button"
            >
              {btn === "del" ? "⌫" : btn}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

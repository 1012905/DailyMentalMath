import { createSignal, Show } from "solid-js";
import { signUp, signIn, signOut, isSupabaseReady } from "../supabase.js";

export default function AuthModal(props) {
  const [mode, setMode] = createSignal("login");
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [success, setSuccess] = createSignal("");

  if (!isSupabaseReady()) {
    return (
      <div class="auth-bar">
        <span style={{ color: "var(--text-muted)", "font-size": "0.8rem" }}>
          ⚙️ 配置 .env 后启用账号系统（VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY）
        </span>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      if (mode() === "register") {
        await signUp(email(), password());
        setSuccess("注册成功！请检查邮箱确认。");
        setMode("login");
      } else {
        const data = await signIn(email(), password());
        if (data.user) {
          setSuccess("登录成功！");
          props.onLogin?.(data.user);
        }
      }
    } catch (err) {
      setError(err.message || "操作失败");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      props.onLogout?.();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div class="auth-bar">
      <Show
        when={props.user}
        fallback={
          <form class="auth-form" onSubmit={handleSubmit}>
            <input type="email" class="auth-input" placeholder="邮箱"
              value={email()} onInput={(e) => setEmail(e.target.value)} required />
            <input type="password" class="auth-input" placeholder="密码（至少6位）"
              value={password()} onInput={(e) => setPassword(e.target.value)} required minLength={6} />
            <button type="submit" class="auth-btn" disabled={loading()}>
              {loading() ? "..." : mode() === "login" ? "登录" : "注册"}
            </button>
            <button type="button" class="auth-switch-btn" onClick={() => {
              setMode(mode() === "login" ? "register" : "login");
              setError(""); setSuccess("");
            }}>
              {mode() === "login" ? "没有账号？注册" : "已有账号？登录"}
            </button>
            <Show when={error()}>
              <span class="auth-error">{error()}</span>
            </Show>
            <Show when={success()}>
              <span class="auth-success">{success()}</span>
            </Show>
          </form>
        }
      >
        <div class="auth-user-info">
          <span class="auth-email">{props.user.email}</span>
          <button class="auth-btn logout" onClick={handleLogout}>退出</button>
        </div>
      </Show>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { backendApi } from "@/app/lib/backend-api";

type Language = "ko" | "en";
type Mode = "login" | "signup" | "recover" | "reset";
type RecoveryAction = "username" | "password";

type User = {
  id: number;
  username: string;
  email: string;
};

type Session = {
  authenticated: boolean;
  user: User | null;
};

const COPY = {
  ko: {
    login: "로그인",
    logout: "로그아웃",
    account: "계정",
    signup: "회원가입",
    username: "아이디",
    email: "이메일",
    password: "비밀번호",
    confirmPassword: "비밀번호 확인",
    close: "닫기",
    recover: "아이디·비밀번호 찾기",
    findUsername: "아이디 찾기",
    resetPassword: "비밀번호 재설정",
    send: "이메일 보내기",
    changePassword: "비밀번호 변경",
    backToLogin: "로그인으로 돌아가기",
    signupHelp: "이메일 인증 없이 바로 가입됩니다. 이메일은 계정 복구에만 사용합니다.",
    passwordHelp: "영문과 숫자를 포함해 8자 이상 입력하세요.",
    mismatch: "비밀번호가 일치하지 않습니다.",
    genericMail: "입력한 이메일과 일치하는 계정이 있으면 안내 메일을 보냈습니다.",
    resetDone: "비밀번호가 변경되었습니다. 새 비밀번호로 로그인하세요.",
    working: "처리 중",
  },
  en: {
    login: "Sign in",
    logout: "Sign out",
    account: "Account",
    signup: "Create account",
    username: "Username",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm password",
    close: "Close",
    recover: "Recover account",
    findUsername: "Find username",
    resetPassword: "Reset password",
    send: "Send email",
    changePassword: "Change password",
    backToLogin: "Back to sign in",
    signupHelp: "No signup verification is required. Email is used only for account recovery.",
    passwordHelp: "Use at least 8 characters with a letter and a number.",
    mismatch: "Passwords do not match.",
    genericMail: "If the email matches an account, recovery instructions have been sent.",
    resetDone: "Your password was changed. Sign in with the new password.",
    working: "Working",
  },
} as const;

export default function AccountAccess({ language }: { language: Language }) {
  const copy = COPY[language];
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("login");
  const [recoveryAction, setRecoveryAction] =
    useState<RecoveryAction>("username");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    backendApi<Session>("/auth/me")
      .then((response) => setUser(response.data.authenticated ? response.data.user : null))
      .catch(() => setUser(null));

    const token = new URLSearchParams(window.location.search).get("resetToken");
    if (token) {
      queueMicrotask(() => {
        setResetToken(token);
        setMode("reset");
        setIsOpen(true);
      });
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setMessage(null);
    setError(null);
    setPassword("");
    setPasswordConfirm("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if ((mode === "signup" || mode === "reset") && password !== passwordConfirm) {
      setError(copy.mismatch);
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "login") {
        const response = await backendApi<User>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ username, password }),
        });
        setUser(response.data);
        setIsOpen(false);
      } else if (mode === "signup") {
        const response = await backendApi<User>("/auth/signup", {
          method: "POST",
          body: JSON.stringify({ username, email, password }),
        });
        setUser(response.data);
        setIsOpen(false);
      } else if (mode === "recover") {
        const path =
          recoveryAction === "username"
            ? "/auth/username/reminder"
            : "/auth/password/forgot";
        await backendApi(path, {
          method: "POST",
          body: JSON.stringify({ email }),
        });
        setMessage(copy.genericMail);
      } else {
        await backendApi("/auth/password/reset", {
          method: "POST",
          body: JSON.stringify({ token: resetToken, newPassword: password }),
        });
        window.history.replaceState({}, "", window.location.pathname);
        setResetToken("");
        setMessage(copy.resetDone);
        setMode("login");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Request failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function logout() {
    try {
      await backendApi("/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  }

  return (
    <>
      {user ? (
        <div className="flex items-center gap-2">
          <span className="max-w-24 truncate text-xs font-semibold text-[#344054]" title={user.email}>
            {user.username}
          </span>
          <button
            className="h-9 border border-[#d0d5dd] bg-white px-3 text-xs font-semibold text-[#344054] transition hover:bg-[#f8fafc]"
            type="button"
            onClick={logout}
          >
            {copy.logout}
          </button>
        </div>
      ) : (
        <button
          className="h-9 border border-[#2563eb] bg-white px-3 text-xs font-semibold text-[#2563eb] transition hover:bg-[#eff6ff]"
          type="button"
          onClick={() => {
            switchMode("login");
            setIsOpen(true);
          }}
        >
          {copy.login}
        </button>
      )}

      {isOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4"
          role="dialog"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto border border-[#d0d5dd] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase text-[#2563eb]">Global K-Route</p>
                <h2 className="mt-1 text-xl font-semibold text-[#101828]">
                  {mode === "login" && copy.login}
                  {mode === "signup" && copy.signup}
                  {mode === "recover" && copy.recover}
                  {mode === "reset" && copy.resetPassword}
                </h2>
              </div>
              <button
                aria-label={copy.close}
                className="h-9 w-9 border border-[#d0d5dd] bg-white text-lg text-[#475467] hover:bg-[#f8fafc]"
                type="button"
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </div>

            {mode === "recover" ? (
              <div className="mt-5 grid grid-cols-2 border border-[#d0d5dd] p-1">
                {(["username", "password"] as RecoveryAction[]).map((action) => (
                  <button
                    className={`h-10 text-sm font-semibold ${
                      recoveryAction === action
                        ? "bg-[#101828] text-white"
                        : "bg-white text-[#475467]"
                    }`}
                    key={action}
                    type="button"
                    onClick={() => setRecoveryAction(action)}
                  >
                    {action === "username" ? copy.findUsername : copy.resetPassword}
                  </button>
                ))}
              </div>
            ) : null}

            <form className="mt-5 space-y-4" onSubmit={submit}>
              {mode === "login" || mode === "signup" ? (
                <Field label={copy.username} value={username} onChange={setUsername} autoComplete="username" />
              ) : null}
              {mode === "signup" || mode === "recover" ? (
                <Field label={copy.email} value={email} onChange={setEmail} type="email" autoComplete="email" />
              ) : null}
              {mode === "login" || mode === "signup" || mode === "reset" ? (
                <Field
                  label={mode === "reset" ? copy.changePassword : copy.password}
                  value={password}
                  onChange={setPassword}
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              ) : null}
              {mode === "signup" || mode === "reset" ? (
                <Field
                  label={copy.confirmPassword}
                  value={passwordConfirm}
                  onChange={setPasswordConfirm}
                  type="password"
                  autoComplete="new-password"
                />
              ) : null}

              {mode === "signup" ? <p className="text-xs leading-5 text-[#667085]">{copy.signupHelp}</p> : null}
              {mode === "signup" || mode === "reset" ? <p className="text-xs leading-5 text-[#667085]">{copy.passwordHelp}</p> : null}
              {error ? <p className="border-l-2 border-[#dc2626] pl-3 text-sm text-[#b42318]">{error}</p> : null}
              {message ? <p className="border-l-2 border-[#16a34a] pl-3 text-sm text-[#166534]">{message}</p> : null}

              <button
                className="h-12 w-full bg-[#2563eb] px-4 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:bg-[#93c5fd]"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting
                  ? copy.working
                  : mode === "login"
                    ? copy.login
                    : mode === "signup"
                      ? copy.signup
                      : mode === "recover"
                        ? copy.send
                        : copy.changePassword}
              </button>
            </form>

            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-[#e4e7ec] pt-4 text-sm">
              {mode === "login" ? (
                <>
                  <button className="font-semibold text-[#2563eb]" type="button" onClick={() => switchMode("signup")}>{copy.signup}</button>
                  <button className="font-semibold text-[#475467]" type="button" onClick={() => switchMode("recover")}>{copy.recover}</button>
                </>
              ) : (
                <button className="font-semibold text-[#2563eb]" type="button" onClick={() => switchMode("login")}>{copy.backToLogin}</button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-[#344054]">
      {label}
      <input
        required
        className="mt-2 h-12 w-full border border-[#d0d5dd] bg-white px-3 text-sm font-medium text-[#101828] outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#dbeafe]"
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

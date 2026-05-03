"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Credentials } from "@/types/community";
import Link from "next/link";

type AuthMode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authForm, setAuthForm] = useState({ username: "", password: "", email: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && window.sessionStorage.getItem("community.credentials")) {
      router.push("/");
    }
  }, [router]);

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    try {
      const payload = {
        username: authForm.username.trim(),
        password: authForm.password,
      };
      
      if (authMode === "signup") {
        await api.signup({ ...payload, email: authForm.email.trim() });
      } else {
        await api.login(payload);
      }

      window.sessionStorage.setItem("community.credentials", JSON.stringify(payload));
      
      setNotice(authMode === "signup" ? "회원가입 후 로그인되었습니다. 이동 중..." : "로그인되었습니다. 이동 중...");
      
      setTimeout(() => {
        router.push("/");
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "인증 요청에 실패했습니다.");
    }
  }

  return (
    <div className="standalone-page">
      <div className="standalone-card">
        <div className="section-title">
          <h2>{authMode === "login" ? "로그인" : "회원가입"}</h2>
          <button
            className="text-button"
            type="button"
            onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
          >
            {authMode === "login" ? "회원가입" : "로그인"}으로 이동
          </button>
        </div>

        {(error || notice) && <div className={error ? "feedback error" : "feedback notice"}>{error || notice}</div>}

        <form className="stack-form" onSubmit={handleAuth}>
          <label>
            아이디
            <input
              value={authForm.username}
              onChange={(event) => setAuthForm({ ...authForm, username: event.target.value })}
              minLength={3}
              required
            />
          </label>
          <label>
            비밀번호
            <input
              value={authForm.password}
              onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
              type="password"
              minLength={8}
              required
            />
          </label>
          {authMode === "signup" && (
            <label>
              이메일
              <input
                value={authForm.email}
                onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })}
                type="email"
                required
              />
            </label>
          )}
          <button className="primary-button" type="submit" style={{ marginTop: '10px' }}>
            {authMode === "login" ? "로그인" : "가입하기"}
          </button>
        </form>
        
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Link href="/" className="text-button">메인으로 돌아가기</Link>
        </div>
      </div>
    </div>
  );
}

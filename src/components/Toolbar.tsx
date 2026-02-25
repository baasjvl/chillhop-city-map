"use client";

import { useState } from "react";

interface ToolbarProps {
  isAuthenticated: boolean;
  authorName: string;
  onRefresh: () => void;
  onLogin: (name: string, password: string) => Promise<boolean>;
}

export default function Toolbar({
  isAuthenticated,
  authorName,
  onRefresh,
  onLogin,
}: ToolbarProps) {
  const [showLogin, setShowLogin] = useState(false);
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState(false);

  const handleLogin = async () => {
    const ok = await onLogin(loginName, loginPassword);
    if (ok) {
      setShowLogin(false);
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 48,
          background: "var(--panel)",
          borderBottom: "1px solid var(--panel-border)",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 12,
          zIndex: 100,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: "0.02em" }}>
          Lore Map
        </span>
        <div style={{ width: 1, height: 24, background: "var(--panel-border)" }} />

        <button
          onClick={onRefresh}
          style={{
            background: "rgba(58, 50, 38, 0.2)",
            border: "1px solid var(--panel-border)",
            color: "var(--text)",
            padding: "6px 12px",
            borderRadius: 6,
            fontSize: 12,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Refresh
        </button>

        <div style={{ flex: 1 }} />

        {isAuthenticated ? (
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Editing as <strong style={{ color: "#F5A855" }}>{authorName}</strong>
          </span>
        ) : (
          <button
            onClick={() => setShowLogin(true)}
            style={{
              background: "#F5A855",
              border: "1px solid #F5A855",
              color: "#3A3226",
              padding: "6px 12px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Sign in to edit
          </button>
        )}
      </div>

      {/* Login modal */}
      {showLogin && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowLogin(false)}
        >
          <div
            style={{
              background: "var(--panel)",
              border: "1px solid var(--panel-border)",
              borderRadius: 12,
              padding: 32,
              width: 340,
              boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 18, marginBottom: 8 }}>Sign in</h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
              Enter your name and the editor password to place and move pins.
            </p>
            <input
              type="text"
              placeholder="Your name"
              value={loginName}
              onChange={(e) => setLoginName(e.target.value)}
              style={{
                width: "100%",
                background: "rgba(58, 50, 38, 0.2)",
                border: "1px solid var(--panel-border)",
                color: "var(--text)",
                padding: "10px 14px",
                borderRadius: 8,
                fontSize: 14,
                marginBottom: 12,
                outline: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
            <input
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              style={{
                width: "100%",
                background: "rgba(58, 50, 38, 0.2)",
                border: `1px solid ${loginError ? "#E85D5D" : "var(--panel-border)"}`,
                color: "var(--text)",
                padding: "10px 14px",
                borderRadius: 8,
                fontSize: 14,
                marginBottom: loginError ? 8 : 16,
                outline: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
            {loginError && (
              <p style={{ fontSize: 12, color: "#E85D5D", marginBottom: 12 }}>
                Wrong password. Try again.
              </p>
            )}
            <button
              onClick={handleLogin}
              style={{
                width: "100%",
                background: "#F5A855",
                border: "none",
                color: "#3A3226",
                padding: "10px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Sign in
            </button>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-sm p-6">
      <h1 className="text-xl font-bold">注册</h1>

      <form
        className="mt-4 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setMsg(null);

          const r = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ name, email, password }),
          });

          if (!r.ok) {
            const data = await r.json().catch(() => ({}));
            setMsg(data?.message ?? "注册失败");
            return;
          }

          // 注册成功后自动登录
          await signIn("credentials", {
            email,
            password,
            redirect: true,
            callbackUrl: "/",
          });
        }}
      >
        <input
          className="w-full rounded border p-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="昵称"
        />
        <input
          className="w-full rounded border p-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="邮箱"
        />
        <input
          className="w-full rounded border p-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="密码"
          type="password"
        />
        {msg && <p className="text-sm">{msg}</p>}
        <button className="w-full rounded bg-black p-2 text-white">
          注册并登录
        </button>
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-sm p-6">
      <h1 className="text-xl font-bold">登录</h1>

      <form
        className="mt-4 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);

          const res = await signIn("credentials", {
            email,
            password,
            redirect: true,
            callbackUrl: "/",
          });

          // redirect: true 时通常不会走到这里；保留是为了调试
        }}
      >
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
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded bg-black p-2 text-white">登录</button>
      </form>
    </div>
  );
}

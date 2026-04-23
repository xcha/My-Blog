"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="mx-auto flex min-h-[calc(100vh-0px)] max-w-md items-center p-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>注册</CardTitle>
          <CardDescription>创建账号后将自动登录</CardDescription>
        </CardHeader>

        <CardContent>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setPending(true);

              const r = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ name, email, password }),
              });

              if (!r.ok) {
                const data = await r.json().catch(() => ({}));
                toast.error(data?.message ?? "注册失败");
                setPending(false);
                return;
              }

              const res = await signIn("credentials", {
                email,
                password,
                redirect: false,
              });
              setPending(false);

              if (res?.error) {
                toast.success("注册成功");
                toast.error("自动登录失败，请手动登录");
                router.push("/login");
                return;
              }

              toast.success("注册并登录成功");
              router.push("/");
              router.refresh();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="name">昵称</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="你的昵称"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少 6 位"
              />
            </div>

            <Button className="w-full" disabled={pending} type="submit">
              {pending ? "提交中..." : "注册并登录"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
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

// 静态图片数组 - 请替换为你实际的图片路径
const BACKGROUND_IMAGES = [
  "/images/WEATHERING_WITH_YOU_002512.602.jpg",
  "/images/WEATHERING_WITH_YOU_002535.454.jpg",
  "/images/WEATHERING_WITH_YOU_003658.589.jpg",
  "/images/WEATHERING_WITH_YOU_013610.095.jpg",
  "/images/WEATHERING_WITH_YOU_013611.124.webp",
];
export default function RegisterPage() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 背景图轮播
  useEffect(() => {
    if (BACKGROUND_IMAGES.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 5000); // 每5秒切换一次

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-0px)]">
      {/* 背景图轮播区域 */}
      <div className="fixed inset-0 -z-10">
        {BACKGROUND_IMAGES.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentImageIndex ? "opacity-100" : "opacity-0"
            }`}
            style={{
              backgroundImage: `url(${img})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />
        ))}
        {/* 深色遮罩层，让卡片更突出 */}
        <div className="absolute inset-0 bg-black/0" />
      </div>

      {/* 注册卡片容器 */}
      <div className="mx-auto flex min-h-[calc(100vh-0px)] max-w-md items-center p-6">
        <Card className="w-full  bg-white/85 shadow-xl border border-white/20">
          <CardHeader>
            <p className="flex justify-center">恋次的个人博客</p>
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
                  className="bg-white/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="bg-white/50"
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
                  className="bg-white/50"
                />
              </div>

              <Button className="w-full" disabled={pending} type="submit">
                {pending ? "提交中..." : "注册并登录"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

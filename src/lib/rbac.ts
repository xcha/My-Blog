import "server-only";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    // 未登录：直接跳去登录页
    redirect("/login");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireUser();

  // 非管理员：跳转到 403 页面（而不是抛 500）
  if (session.user.role !== "ADMIN") {
    redirect("/forbidden");
  }
  return session;
}

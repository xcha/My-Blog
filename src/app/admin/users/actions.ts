"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import type { Role } from "@/generated/prisma/client";

const setRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["USER", "ADMIN"]),
});

export async function setUserRole(formData: FormData) {
  // 难点注释：Server Action 一定要做服务端鉴权，不能信任前端
  await requireAdmin();

  const parsed = setRoleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    throw new Error("参数不合法");
  }

  const { userId, role } = parsed.data as { userId: string; role: Role };

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  // 难点注释：让 /admin/users 重新拉取最新数据（否则页面还是旧列表）
  revalidatePath("/admin/users");
}

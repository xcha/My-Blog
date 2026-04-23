"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { auditLog } from "@/lib/audit";

type ActionState = { ok: boolean; message?: string };

const setRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["USER", "ADMIN"]),
});

export async function setUserRole(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireAdmin();

  const parsed = setRoleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });

  if (!parsed.success) return { ok: false, message: "参数不合法" };

  const { userId, role } = parsed.data;

  // 可选：记录旧值（更专业）
  const before = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, email: true },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  await auditLog({
    actorId: session.user.id,
    action: "user.setRole",
    targetType: "User",
    targetId: userId,
    meta: {
      email: before?.email,
      beforeRole: before?.role,
      afterRole: role,
    },
  });

  revalidatePath("/admin/users");
  return { ok: true, message: `已设置为 ${role}` };
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  // 只有管理员才能提权别人（防止被随便调用）
  await requireAdmin();

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "参数不合法" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { email: parsed.data.email },
    data: { role: "ADMIN" },
    select: { id: true, email: true, role: true },
  });

  return NextResponse.json({ user });
}

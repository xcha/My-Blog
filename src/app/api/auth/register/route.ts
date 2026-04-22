import { NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().min(1, "请输入昵称").max(50, "昵称太长"),
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(6, "密码至少 6 位"),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "参数不合法", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;

  const existed = await prisma.user.findUnique({ where: { email } });
  if (existed) {
    return NextResponse.json({ message: "该邮箱已注册" }, { status: 409 });
  }

  // 难点注释：永远只存 password hash，绝不存明文
  const passwordHash = await hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: passwordHash,
      // role 默认 USER；管理员我们后面用 seed/后台提升
    },
    select: { id: true, email: true, name: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}

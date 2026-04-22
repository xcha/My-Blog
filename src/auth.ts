import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import type { Role } from "@/generated/prisma/client";

const signInSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(6, "密码至少 6 位"),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  // PrismaAdapter 在 TS 上和 Prisma v7 的泛型不完全匹配，这里做一次安全的类型过桥
  adapter: PrismaAdapter(
    prisma as unknown as Parameters<typeof PrismaAdapter>[0],
  ),

  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        const parsed = signInSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
          },
        });

        if (!user?.password) return null;

        const ok = await compare(password, user.password);
        if (!ok) return null;

        // 返回的对象会成为 jwt({ user }) 里的 user
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],

  // 关键：Credentials 只能在 JWT strategy 下使用
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },

  callbacks: {
    async jwt({ token, user }) {
      // user 只在“刚登录成功”的那一次存在
      if (user) {
        // 这里 user 是 authorize 返回的对象（我们带了 role）
        token.id = user.id;
        token.role = user.role as Role;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? "");
        session.user.role = (token.role as Role) ?? "USER";
      }
      return session;
    },
  },
});

export const { GET, POST } = handlers;

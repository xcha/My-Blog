import { DefaultSession } from "next-auth";
import { Role } from "@/generated/prisma/client";
import { DefaultSession } from "next-auth";
import { Role } from "@/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  // 注意：必须可选，否则会把 AdapterUser 也“强制要求 role”，引发一堆类型不兼容
  interface User {
    role?: Role;
  }
}

// NextAuth v5 / Auth.js 的 Adapter 类型在 @auth/core
declare module "@auth/core/adapters" {
  interface AdapterUser {
    role?: Role;
  }
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role?: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    role?: Role;
  }
}

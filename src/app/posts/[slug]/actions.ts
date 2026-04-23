"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";
import { redirect } from "next/navigation";

import { updateTag } from "next/cache";

type ActionState = { ok: boolean; message?: string };

const createSchema = z.object({
  postId: z.string().min(1),
  slug: z.string().min(1),
  content: z.string().trim().min(1, "评论不能为空").max(500, "评论最多 500 字"),
});

// 用 useActionState 时，server action 需要 (prevState, formData)
export async function createComment(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireUser();

  const parsed = createSchema.safeParse({
    postId: formData.get("postId"),
    slug: formData.get("slug"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "参数不合法",
    };
  }

  const { postId, slug, content } = parsed.data;

  // 反垃圾（亮点）：同一用户对同一文章 10 秒内只能发 1 条
  const last = await prisma.comment.findFirst({
    where: { postId, authorId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  if (last && Date.now() - last.createdAt.getTime() < 10_000) {
    return { ok: false, message: "发太快了，10 秒后再试" };
  }

  await prisma.comment.create({
    data: { postId, authorId: session.user.id, content },
  });
  updateTag(`post:slug:${slug}`);
  redirect(`/posts/${slug}`);
}

const deleteSchema = z.object({
  commentId: z.string().min(1),
  slug: z.string().min(1),
});

export async function deleteComment(formData: FormData) {
  const session = await requireUser();
  const parsed = deleteSchema.safeParse({
    commentId: formData.get("commentId"),
    slug: formData.get("slug"),
  });
  if (!parsed.success) throw new Error("参数不合法");

  const { commentId, slug } = parsed.data;

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, authorId: true },
  });
  if (!comment) redirect(`/posts/${slug}`);

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = comment.authorId === session.user.id;

  // 权限控制：管理员 or 评论作者 才能删
  if (!isAdmin && !isOwner) {
    redirect("/forbidden");
  }

  await prisma.comment.update({
    where: { id: commentId },
    data: {
      status: "DELETED",
      moderatedAt: new Date(),
      moderatedById: session.user.id,
      reason: isAdmin ? "管理员删除" : "作者删除",
    },
  });
  redirect(`/posts/${slug}`);
}

const moderateSchema = z.object({
  commentId: z.string().min(1),
  slug: z.string().min(1),
  action: z.enum(["hide", "unhide"]),
  reason: z.string().max(100).optional(),
});

export async function moderateComment(formData: FormData) {
  const session = await requireUser();
  if (session.user.role !== "ADMIN") redirect("/forbidden");

  const parsed = moderateSchema.safeParse({
    commentId: formData.get("commentId"),
    slug: formData.get("slug"),
    action: formData.get("action"),
    reason: formData.get("reason")?.toString() || undefined,
  });
  if (!parsed.success) throw new Error("参数不合法");

  const { commentId, slug, action, reason } = parsed.data;

  await prisma.comment.update({
    where: { id: commentId },
    data: {
      status: action === "hide" ? "HIDDEN" : "VISIBLE",
      moderatedAt: new Date(),
      moderatedById: session.user.id,
      reason: action === "hide" ? reason || "管理员屏蔽" : null,
    },
  });

  redirect(`/posts/${slug}`);
}

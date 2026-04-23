"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { auditLog } from "@/lib/audit";

const batchSchema = z.object({
  commentIds: z.array(z.string().min(1)).min(1),
  intent: z.enum(["hide", "unhide", "delete"]),
});

export async function batchModerateComments(
  commentIds: string[],
  intent: "hide" | "unhide" | "delete",
) {
  const session = await requireAdmin();

  const parsed = batchSchema.safeParse({ commentIds, intent });
  if (!parsed.success) throw new Error("请先勾选评论，再点击批量操作");

  const now = new Date();

  await prisma.comment.updateMany({
    where: { id: { in: parsed.data.commentIds } },
    data: {
      status:
        parsed.data.intent === "delete"
          ? "DELETED"
          : parsed.data.intent === "hide"
            ? "HIDDEN"
            : "VISIBLE",
      moderatedAt: now,
      moderatedById: session.user.id,
      reason:
        parsed.data.intent === "delete"
          ? "后台软删除"
          : parsed.data.intent === "hide"
            ? "后台屏蔽"
            : null,
    },
  });

  await auditLog({
    actorId: session.user.id,
    action:
      parsed.data.intent === "hide"
        ? "comment.hide.batch"
        : parsed.data.intent === "unhide"
          ? "comment.unhide.batch"
          : "comment.delete.batch",
    targetType: "Comment",
    meta: {
      count: parsed.data.commentIds.length,
      commentIds: parsed.data.commentIds,
    },
  });

  revalidatePath("/admin/comments");
}

const singleSchema = z.object({
  commentId: z.string().min(1),
  intent: z.enum(["hide", "unhide", "delete"]),
});

export async function moderateComment(formData: FormData) {
  const session = await requireAdmin();

  const parsed = singleSchema.safeParse({
    commentId: formData.get("commentId"),
    intent: formData.get("intent"),
  });
  if (!parsed.success) throw new Error("参数不合法");

  const now = new Date();

  await prisma.comment.update({
    where: { id: parsed.data.commentId },
    data: {
      status:
        parsed.data.intent === "delete"
          ? "DELETED"
          : parsed.data.intent === "hide"
            ? "HIDDEN"
            : "VISIBLE",
      moderatedAt: now,
      moderatedById: session.user.id,
      reason:
        parsed.data.intent === "delete"
          ? "后台软删除"
          : parsed.data.intent === "hide"
            ? "后台屏蔽"
            : null,
    },
  });

  await auditLog({
    actorId: session.user.id,
    action:
      parsed.data.intent === "hide"
        ? "comment.hide"
        : parsed.data.intent === "unhide"
          ? "comment.unhide"
          : "comment.delete",
    targetType: "Comment",
    targetId: parsed.data.commentId,
    meta: { intent: parsed.data.intent },
  });

  revalidatePath("/admin/comments");
}

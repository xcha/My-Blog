"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { auditLog } from "@/lib/audit";

/** 批量：给 BulkBar 直接调用 */
const batchSchema = z.object({
  postIds: z.array(z.string().min(1)).min(1),
  intent: z.enum(["approve", "reject"]),
});

export async function batchModeratePosts(
  postIds: string[],
  intent: "approve" | "reject",
) {
  const session = await requireAdmin();

  const parsed = batchSchema.safeParse({ postIds, intent });
  if (!parsed.success) throw new Error("请先勾选文章，再点击批量操作");

  await prisma.$transaction(async (tx) => {
    if (parsed.data.intent === "approve") {
      await tx.post.updateMany({
        where: { id: { in: parsed.data.postIds } },
        data: { status: "PUBLISHED", publishedAt: new Date() },
      });
    } else {
      await tx.post.updateMany({
        where: { id: { in: parsed.data.postIds } },
        data: { status: "REJECTED", isPinned: false, publishedAt: null },
      });
    }
  });

  // ✅ 批量日志：不写 targetId（太多），写 meta 记录数量和 ids（可选）
  await auditLog({
    actorId: session.user.id,
    action:
      parsed.data.intent === "approve"
        ? "post.batchApprove"
        : "post.batchReject",
    targetType: "Post",
    meta: { count: parsed.data.postIds.length, postIds: parsed.data.postIds },
  });

  revalidatePath("/admin/posts");
  revalidatePath("/");
}

/** 单篇：给表格行 <form action={moderatePost}> 用 */
const moderateSchema = z.object({
  postId: z.string().min(1),
  intent: z.enum(["approve", "reject"]),
});

export async function moderatePost(formData: FormData) {
  const session = await requireAdmin();

  const parsed = moderateSchema.safeParse({
    postId: formData.get("postId"),
    intent: formData.get("intent"),
  });
  if (!parsed.success) throw new Error("参数不合法");

  await prisma.$transaction(async (tx) => {
    if (parsed.data.intent === "approve") {
      await tx.post.update({
        where: { id: parsed.data.postId },
        data: { status: "PUBLISHED", publishedAt: new Date() },
      });
    } else {
      await tx.post.update({
        where: { id: parsed.data.postId },
        data: { status: "REJECTED", isPinned: false, publishedAt: null },
      });
    }
  });

  await auditLog({
    actorId: session.user.id,
    action: parsed.data.intent === "approve" ? "post.approve" : "post.reject",
    targetType: "Post",
    targetId: parsed.data.postId,
    meta: { intent: parsed.data.intent },
  });

  revalidatePath("/admin/posts");
  revalidatePath("/");
}

/** 置顶：给 PinSwitch 直接调用（FormData） */
const pinSchema = z.object({
  postId: z.string().min(1),
  pinned: z.enum(["true", "false"]),
});

export async function setPinned(formData: FormData) {
  const session = await requireAdmin();

  const parsed = pinSchema.safeParse({
    postId: formData.get("postId"),
    pinned: formData.get("pinned"),
  });
  if (!parsed.success) throw new Error("参数不合法");

  const pinned = parsed.data.pinned === "true";

  await prisma.post.update({
    where: { id: parsed.data.postId },
    data: { isPinned: pinned },
  });

  await auditLog({
    actorId: session.user.id,
    action: pinned ? "post.pin" : "post.unpin",
    targetType: "Post",
    targetId: parsed.data.postId,
    meta: { pinned },
  });

  revalidatePath("/admin/posts");
  revalidatePath("/");
}

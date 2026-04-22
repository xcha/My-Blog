"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

const schema = z.object({
  postId: z.string().min(1),
  action: z.enum(["approve", "reject", "pin", "unpin"]),
});

export async function moderatePost(formData: FormData) {
  await requireAdmin();

  const parsed = schema.safeParse({
    postId: formData.get("postId"),
    action: formData.get("action"),
  });
  if (!parsed.success) throw new Error("参数不合法");

  const { postId, action } = parsed.data;

  // 难点亮点：用事务保证“状态变更 + 置顶/发布时间”等一致性
  await prisma.$transaction(async (tx) => {
    if (action === "approve") {
      await tx.post.update({
        where: { id: postId },
        data: { status: "PUBLISHED", publishedAt: new Date() },
      });
    }
    if (action === "reject") {
      await tx.post.update({
        where: { id: postId },
        data: { status: "REJECTED", isPinned: false, publishedAt: null },
      });
    }
    if (action === "pin") {
      await tx.post.update({ where: { id: postId }, data: { isPinned: true } });
    }
    if (action === "unpin") {
      await tx.post.update({
        where: { id: postId },
        data: { isPinned: false },
      });
    }
  });

  revalidatePath("/admin/posts");
  revalidatePath("/");
}

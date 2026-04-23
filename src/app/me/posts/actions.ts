"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";
import { slugify } from "@/lib/slug";
import { revalidatePath } from "next/cache";

import { revalidateTag } from "next/cache";

const upsertSchema = z.object({
  postId: z.string().optional(),
  title: z.string().min(1, "标题不能为空").max(120, "标题太长"),
  content: z.string().min(1, "内容不能为空"),
  action: z.enum(["save_draft", "submit_review"]),
  tags: z.string().optional(),
});

export async function upsertMyPost(formData: FormData) {
  const session = await requireUser();

  const parsed = upsertSchema.safeParse({
    postId: formData.get("postId")?.toString() || undefined,
    title: formData.get("title"),
    content: formData.get("content"),
    action: formData.get("action"),
  });
  if (!parsed.success) throw new Error("参数不合法");

  const { postId, title, content, action } = parsed.data;

  const rawTags = (parsed.data.tags ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // 去重 + 限制数量（防止滥用）
  const tagNames = Array.from(new Set(rawTags)).slice(0, 5);

  // 难点：slug 防冲突（标题相同也能发）
  const base = slugify(title) || "post";
  let slug = base;
  let i = 1;
  while (true) {
    const existed = await prisma.post.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existed || existed.id === postId) break;
    i += 1;
    slug = `${base}-${i}`;
  }

  const status = action === "submit_review" ? "PENDING" : "DRAFT";

  if (!postId) {
    await prisma.post.create({
      data: {
        title,
        slug,
        content,
        status,
        authorId: session.user.id,
      },
    });
  } else {
    // 作者只能改自己的文章（权限点）
    await prisma.post.update({
      where: { id: postId, authorId: session.user.id },
      data: { title, slug, content, status },
    });
  }

  revalidatePath("/me/posts");
  revalidatePath("/"); // 首页也会展示文章列表
}

export async function deleteMyPost(formData: FormData) {
  const session = await requireUser();
  const postId = String(formData.get("postId") || "");
  if (!postId) throw new Error("参数不合法");

  await prisma.post.delete({
    where: { id: postId, authorId: session.user.id },
  });

  revalidatePath("/me/posts");
  revalidatePath("/");
}

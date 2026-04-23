import "server-only";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

/**
 * 公开列表：只缓存已发布文章
 * tag: posts:published
 */
export const getPublishedPosts = unstable_cache(
  async () => {
    return prisma.post.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        isPinned: true,
        publishedAt: true,
      },
    });
  },
  ["getPublishedPosts"],
  { tags: ["posts:published"] },
);

/**
 * 公开详情：只缓存已发布 + 只展示 VISIBLE 评论（避免把管理员视图缓存给普通用户）
 * tag: post:slug:${slug}
 */
export function getPublicPostBySlug(slug: string) {
  return unstable_cache(
    async () => {
      return prisma.post.findFirst({
        where: { slug, status: "PUBLISHED" },
        select: {
          id: true,
          title: true,
          slug: true,
          content: true,
          publishedAt: true,
          author: { select: { email: true, name: true } },
          tags: {
            select: {
              tag: { select: { name: true, slug: true } },
            },
          },
          comments: {
            where: { status: "VISIBLE" },
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              content: true,
              createdAt: true,
              authorId: true,
              author: { select: { email: true, name: true } },
            },
          },
        },
      });
    },
    ["getPublicPostBySlug", slug],
    { tags: [`post:slug:${slug}`] },
  )();
}

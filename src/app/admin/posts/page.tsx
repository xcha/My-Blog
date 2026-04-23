import Link from "next/link";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import PostsTableClient from "./PostsTableClient";

type Status = "ALL" | "DRAFT" | "PENDING" | "PUBLISHED" | "REJECTED";

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: Status }>;
}) {
  await requireAdmin();

  const { status } = await searchParams;
  const current: Status = (status ?? "ALL") as Status;

  const where = current === "ALL" ? {} : { status: current };

  const posts = await prisma.post.findMany({
    where,
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      isPinned: true,
      updatedAt: true,
      author: { select: { email: true } },
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">文章审核 / 管理</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          建议运营流程：先处理 PENDING，再看 REJECTED/DRAFT。
        </p>
      </div>

      <Tabs value={current}>
        <TabsList>
          <TabsTrigger asChild value="ALL">
            <Link href="/admin/posts">全部</Link>
          </TabsTrigger>
          <TabsTrigger asChild value="PENDING">
            <Link href="/admin/posts?status=PENDING">待审</Link>
          </TabsTrigger>
          <TabsTrigger asChild value="PUBLISHED">
            <Link href="/admin/posts?status=PUBLISHED">已发布</Link>
          </TabsTrigger>
          <TabsTrigger asChild value="REJECTED">
            <Link href="/admin/posts?status=REJECTED">驳回</Link>
          </TabsTrigger>
          <TabsTrigger asChild value="DRAFT">
            <Link href="/admin/posts?status=DRAFT">草稿</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 交给 Client 组件处理勾选、批量条、置顶开关 */}
      <PostsTableClient posts={posts} />
    </div>
  );
}

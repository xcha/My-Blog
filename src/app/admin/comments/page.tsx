import Link from "next/link";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CommentsTableClient from "./CommentsTableClient";

type Status = "ALL" | "VISIBLE" | "HIDDEN" | "DELETED";

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: Status }>;
}) {
  await requireAdmin();

  const { status } = await searchParams;
  const current: Status = (status ?? "ALL") as Status;

  const where = current === "ALL" ? {} : { status: current };

  const comments = await prisma.comment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      content: true,
      status: true,
      reason: true,
      createdAt: true,
      author: { select: { email: true } },
      post: { select: { title: true, slug: true } },
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">评论管理</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          支持筛选、批量屏蔽/恢复/软删除。文章链接可直接跳转查看上下文。
        </p>
      </div>

      <Tabs value={current}>
        <TabsList>
          <TabsTrigger asChild value="ALL">
            <Link href="/admin/comments">全部</Link>
          </TabsTrigger>
          <TabsTrigger asChild value="VISIBLE">
            <Link href="/admin/comments?status=VISIBLE">正常</Link>
          </TabsTrigger>
          <TabsTrigger asChild value="HIDDEN">
            <Link href="/admin/comments?status=HIDDEN">屏蔽</Link>
          </TabsTrigger>
          <TabsTrigger asChild value="DELETED">
            <Link href="/admin/comments?status=DELETED">已删</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <CommentsTableClient comments={comments} />
    </div>
  );
}

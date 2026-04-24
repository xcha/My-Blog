import Link from "next/link";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import MyPostRowActions from "./MyPostRowActions";

type Status = "ALL" | "DRAFT" | "PENDING" | "PUBLISHED" | "REJECTED";

function badgeVariant(status: Exclude<Status, "ALL">) {
  switch (status) {
    case "PUBLISHED":
      return "default";
    case "PENDING":
      return "secondary";
    case "REJECTED":
      return "destructive";
    default:
      return "outline";
  }
}

export default async function MyPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: Status }>;
}) {
  const session = await requireUser();
  const { status } = await searchParams;

  const current: Status = (status ?? "ALL") as Status;

  const where =
    current === "ALL"
      ? { authorId: session.user.id }
      : { authorId: session.user.id, status: current };

  const posts = await prisma.post.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      updatedAt: true,
      slug: true,
    },
  });

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link className="text-sm underline" href="/">
            ← 返回首页
          </Link>
          <h1 className="text-xl font-bold">写作中心</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            草稿 → 提交审核（PENDING）→ 管理员发布（PUBLISHED）/驳回（REJECTED）
          </p>{" "}
          <p className="mt-1 text-sm text-muted-foreground">
            由于本站仅处于灰度测试阶段 所有用户再发布文章后
            可以直接到后台通过审核
          </p>
        </div>

        <Button asChild>
          <Link href="/me/posts/new">写文章</Link>
        </Button>
      </div>

      <Tabs value={current}>
        <TabsList>
          <TabsTrigger asChild value="ALL">
            <Link href="/me/posts">全部</Link>
          </TabsTrigger>
          <TabsTrigger asChild value="DRAFT">
            <Link href="/me/posts?status=DRAFT">草稿</Link>
          </TabsTrigger>
          <TabsTrigger asChild value="PENDING">
            <Link href="/me/posts?status=PENDING">待审</Link>
          </TabsTrigger>
          <TabsTrigger asChild value="PUBLISHED">
            <Link href="/me/posts?status=PUBLISHED">已发布</Link>
          </TabsTrigger>
          <TabsTrigger asChild value="REJECTED">
            <Link href="/me/posts?status=REJECTED">被驳回</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>标题</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {posts.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{p.title}</span>
                    {p.status === "PUBLISHED" && (
                      <Link
                        className="text-xs underline text-muted-foreground"
                        href={`/posts/${p.slug}`}
                      >
                        查看公开页
                      </Link>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <Badge variant={badgeVariant(p.status)}>{p.status}</Badge>
                </TableCell>

                <TableCell className="text-muted-foreground">
                  {p.updatedAt.toLocaleString()}
                </TableCell>

                <TableCell className="text-right">
                  <MyPostRowActions postId={p.id} />
                </TableCell>
              </TableRow>
            ))}

            {posts.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  暂无文章
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

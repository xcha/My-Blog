"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import BulkBar from "./BulkBar";
import { moderateComment } from "./actions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type CommentRow = {
  id: string;
  content: string;
  status: "VISIBLE" | "HIDDEN" | "DELETED";
  reason: string | null;
  createdAt: string | Date;
  author: { email: string };
  post: { title: string; slug: string };
};

function badgeVariant(status: CommentRow["status"]) {
  switch (status) {
    case "VISIBLE":
      return "secondary";
    case "HIDDEN":
      return "destructive";
    case "DELETED":
      return "outline";
  }
}

export default function CommentsTableClient({
  comments,
}: {
  comments: CommentRow[];
}) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const selectedIds = useMemo(
    () =>
      Object.entries(selected)
        .filter(([, v]) => v)
        .map(([k]) => k),
    [selected],
  );

  function clear() {
    setSelected({});
  }

  return (
    <div className="space-y-3">
      <BulkBar selectedIds={selectedIds} clear={clear} />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>评论</TableHead>
              <TableHead>作者</TableHead>
              <TableHead>文章</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {comments.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <Checkbox
                    checked={!!selected[c.id]}
                    onCheckedChange={(v) =>
                      setSelected((s) => ({ ...s, [c.id]: Boolean(v) }))
                    }
                  />
                </TableCell>

                <TableCell className="max-w-[520px]">
                  <div className="line-clamp-2 whitespace-pre-wrap text-sm">
                    {c.content}
                  </div>
                  {c.reason ? (
                    <div className="mt-1 text-xs text-muted-foreground">
                      原因：{c.reason}
                    </div>
                  ) : null}
                </TableCell>

                <TableCell className="text-muted-foreground">
                  {c.author.email}
                </TableCell>

                <TableCell>
                  <Link
                    className="underline text-sm"
                    href={`/posts/${c.post.slug}`}
                  >
                    {c.post.title}
                  </Link>
                </TableCell>

                <TableCell>
                  <Badge variant={badgeVariant(c.status)}>{c.status}</Badge>
                </TableCell>

                <TableCell className="text-muted-foreground">
                  {new Date(c.createdAt).toLocaleString()}
                </TableCell>

                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline">
                        操作
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={async () => {
                          const fd = new FormData();
                          fd.set("commentId", c.id);
                          fd.set("intent", "hide");
                          try {
                            await moderateComment(fd);
                            toast.success("已屏蔽");
                          } catch (e) {
                            toast.error(
                              e instanceof Error ? e.message : "操作失败",
                            );
                          }
                        }}
                        className="text-red-600 focus:text-red-600"
                      >
                        屏蔽
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={async () => {
                          const fd = new FormData();
                          fd.set("commentId", c.id);
                          fd.set("intent", "unhide");
                          try {
                            await moderateComment(fd);
                            toast.success("已恢复");
                          } catch (e) {
                            toast.error(
                              e instanceof Error ? e.message : "操作失败",
                            );
                          }
                        }}
                      >
                        恢复
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={async () => {
                          const fd = new FormData();
                          fd.set("commentId", c.id);
                          fd.set("intent", "delete");
                          try {
                            await moderateComment(fd);
                            toast.success("已软删除");
                          } catch (e) {
                            toast.error(
                              e instanceof Error ? e.message : "操作失败",
                            );
                          }
                        }}
                      >
                        软删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}

            {comments.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  暂无评论
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";

import BulkBar from "./BulkBar";
import { moderatePost } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import PinSwitch from "./PinSwitch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PostRow = {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PENDING" | "PUBLISHED" | "REJECTED";
  isPinned: boolean;
  updatedAt: string | Date;
  author: { email: string };
};

function badgeVariant(status: PostRow["status"]) {
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

export default function PostsTableClient({ posts }: { posts: PostRow[] }) {
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
              <TableHead>标题</TableHead>
              <TableHead>作者</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>置顶</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {posts.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <Checkbox
                    checked={!!selected[p.id]}
                    onCheckedChange={(v) =>
                      setSelected((s) => ({ ...s, [p.id]: Boolean(v) }))
                    }
                  />
                </TableCell>

                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{p.title}</span>
                    {p.status === "PUBLISHED" && (
                      <a
                        className="text-xs underline text-muted-foreground"
                        href={`/posts/${p.slug}`}
                      >
                        公开页
                      </a>
                    )}
                  </div>
                </TableCell>

                <TableCell className="text-muted-foreground">
                  {p.author.email}
                </TableCell>

                <TableCell>
                  <Badge variant={badgeVariant(p.status)}>{p.status}</Badge>
                </TableCell>

                <TableCell>
                  <PinSwitch postId={p.id} checked={p.isPinned} />
                </TableCell>

                <TableCell className="text-muted-foreground">
                  {new Date(p.updatedAt).toLocaleString()}
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <form action={moderatePost}>
                      <input type="hidden" name="postId" value={p.id} />
                      <input type="hidden" name="intent" value="approve" />
                      <Button size="sm" type="submit" variant="outline">
                        通过
                      </Button>
                    </form>

                    <form action={moderatePost}>
                      <input type="hidden" name="postId" value={p.id} />
                      <input type="hidden" name="intent" value="reject" />
                      <Button size="sm" type="submit" variant="destructive">
                        驳回
                      </Button>
                    </form>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {posts.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
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

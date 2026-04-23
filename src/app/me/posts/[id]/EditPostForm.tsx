"use client";

import { useState } from "react";
import { toast } from "sonner";

import MarkdownEditor from "@/components/MarkdownEditor";
import { upsertMyPost, deleteMyPost } from "../actions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type Role = "USER" | "ADMIN";
type PostStatus = "DRAFT" | "PENDING" | "PUBLISHED" | "REJECTED";

export default function EditPostForm(props: {
  post: { id: string; title: string; content: string; status: PostStatus };
  tagsText: string;
  meRole: Role;
}) {
  const { post, tagsText } = props;

  const [title, setTitle] = useState(post.title);
  const [tags, setTags] = useState(tagsText);
  const [openDelete, setOpenDelete] = useState(false);

  const statusVariant =
    post.status === "PUBLISHED"
      ? "default"
      : post.status === "PENDING"
        ? "secondary"
        : post.status === "REJECTED"
          ? "destructive"
          : "outline";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              编辑文章 <Badge variant={statusVariant}>{post.status}</Badge>
            </CardTitle>
            <CardDescription>
              草稿可随时修改；提交审核后进入 PENDING；管理员通过后变为
              PUBLISHED。
            </CardDescription>
          </div>

          <Button variant="destructive" onClick={() => setOpenDelete(true)}>
            删除文章
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {post.status === "PENDING" && (
          <Alert className="mb-4">
            <AlertDescription>
              当前文章正在审核中。你仍可修改并再次“提交审核”，将覆盖本次提交内容。
            </AlertDescription>
          </Alert>
        )}

        <form
          action={async (formData) => {
            formData.set("postId", post.id);
            formData.set("title", title);
            formData.set("tags", tags);

            try {
              await upsertMyPost(formData);
              toast.success("保存成功");
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "保存失败");
            }
          }}
          className="space-y-5"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">标题</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">标签</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Next.js, Prisma"
              />
            </div>
          </div>

          <MarkdownEditor name="content" defaultValue={post.content} />

          <div className="flex gap-2">
            <Button
              type="submit"
              name="action"
              value="save_draft"
              variant="outline"
            >
              保存草稿
            </Button>
            <Button type="submit" name="action" value="submit_review">
              提交审核
            </Button>
          </div>
        </form>

        {/* 删除确认弹窗 */}
        <Dialog open={openDelete} onOpenChange={setOpenDelete}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>确认删除文章？</DialogTitle>
              <DialogDescription>
                删除后无法恢复（目前是硬删除）。建议线上可改成“软删除 +
                回收站”。
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenDelete(false)}>
                取消
              </Button>

              <form
                action={async (formData) => {
                  formData.set("postId", post.id);

                  try {
                    await deleteMyPost(formData);
                    toast.success("已删除");
                    // deleteMyPost 会 revalidate 并跳转回列表（如果你在 server action 里做 redirect）
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "删除失败");
                  } finally {
                    setOpenDelete(false);
                  }
                }}
              >
                <Button variant="destructive" type="submit">
                  确认删除
                </Button>
              </form>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

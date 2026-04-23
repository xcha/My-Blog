"use client";

import { useState } from "react";
import { toast } from "sonner";

import MarkdownEditor from "@/components/MarkdownEditor";
import { upsertMyPost } from "../actions";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function NewPostForm() {
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>写文章</CardTitle>
        <CardDescription>
          支持 Markdown、图片上传、标签（逗号分隔）
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          action={async (formData) => {
            // 把受控输入补进 formData（避免空值导致 zod 校验失败）
            formData.set("title", title);
            formData.set("tags", tags);

            try {
              await upsertMyPost(formData);
              toast.success("已保存");
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
                placeholder="给文章起个标题"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">标签</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Next.js, Prisma, PostgreSQL"
                name="tags"
              />
            </div>
          </div>

          <Separator />

          <Tabs defaultValue="edit" className="w-full">
            <TabsList>
              <TabsTrigger value="edit">编辑</TabsTrigger>
              <TabsTrigger value="preview">预览</TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="mt-4">
              <MarkdownEditor
                name="content"
                placeholder={
                  "支持 Markdown（GFM）：\n- 列表\n- 表格\n- 代码块\n\n```ts\nconsole.log('hello')\n```"
                }
              />
            </TabsContent>

            {/* 说明：我们已经在 MarkdownEditor 里做了右侧预览。
               如果你更喜欢 Tabs 切换预览，我们也可以把 MarkdownEditor 改成“只编辑”
               然后在这里单独渲染预览。当前先保持你已有的双栏预览即可。 */}
            <TabsContent value="preview" className="mt-4">
              <div className="rounded border p-4 text-sm text-muted-foreground">
                预览请看编辑区右侧。若你希望“单栏编辑 + Tabs
                预览”，我可以下一步把编辑器改造为该模式。
              </div>
            </TabsContent>
          </Tabs>

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
      </CardContent>
    </Card>
  );
}

import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { upsertMyPost } from "../actions";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireUser();
  const { id } = await params;

  const post = await prisma.post.findFirst({
    where: { id, authorId: session.user.id },
    select: { id: true, title: true, content: true, status: true },
  });

  if (!post) {
    return <div className="p-6">文章不存在或无权限。</div>;
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-bold">编辑文章</h1>
      <p className="mt-2 text-sm text-gray-600">当前状态：{post.status}</p>

      <form className="mt-6 space-y-3" action={upsertMyPost}>
        <input type="hidden" name="postId" value={post.id} />
        <input
          name="title"
          defaultValue={post.title}
          className="w-full rounded border p-2"
        />
        <textarea
          name="content"
          defaultValue={post.content}
          className="h-64 w-full rounded border p-2"
        />
        <div className="flex gap-2">
          <button
            name="action"
            value="save_draft"
            className="rounded border px-3 py-1"
          >
            保存草稿
          </button>
          <button
            name="action"
            value="submit_review"
            className="rounded bg-black px-3 py-1 text-white"
          >
            提交审核
          </button>
        </div>
      </form>
    </div>
  );
}

import { requireUser } from "@/lib/rbac";
import { upsertMyPost } from "../actions";

export default async function NewPostPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-bold">写文章</h1>

      <form className="mt-6 space-y-3" action={upsertMyPost}>
        <input
          name="title"
          className="w-full rounded border p-2"
          placeholder="标题"
        />
        <textarea
          name="content"
          className="h-64 w-full rounded border p-2"
          placeholder="正文（先用纯文本，后面我们升级富文本）"
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

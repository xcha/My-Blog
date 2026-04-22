import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { moderatePost } from "./actions";

export default async function AdminPostsPage() {
  await requireAdmin();

  const posts = await prisma.post.findMany({
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      status: true,
      isPinned: true,
      updatedAt: true,
      author: { select: { email: true } },
    },
  });

  return (
    <div>
      <h1 className="text-xl font-bold">文章审核/管理</h1>

      <div className="mt-6 space-y-3">
        {posts.map((p) => (
          <div key={p.id} className="rounded border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">
                  {p.isPinned ? "📌 " : ""}
                  {p.title}
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  作者：{p.author.email} · 状态：{p.status} ·{" "}
                  {p.updatedAt.toLocaleString()}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <form action={moderatePost}>
                  <input type="hidden" name="postId" value={p.id} />
                  <button
                    name="action"
                    value="approve"
                    className="rounded border px-3 py-1"
                  >
                    通过发布
                  </button>
                </form>
                <form action={moderatePost}>
                  <input type="hidden" name="postId" value={p.id} />
                  <button
                    name="action"
                    value="reject"
                    className="rounded border px-3 py-1"
                  >
                    驳回
                  </button>
                </form>

                {p.isPinned ? (
                  <form action={moderatePost}>
                    <input type="hidden" name="postId" value={p.id} />
                    <button
                      name="action"
                      value="unpin"
                      className="rounded border px-3 py-1"
                    >
                      取消置顶
                    </button>
                  </form>
                ) : (
                  <form action={moderatePost}>
                    <input type="hidden" name="postId" value={p.id} />
                    <button
                      name="action"
                      value="pin"
                      className="rounded border px-3 py-1"
                    >
                      置顶
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        ))}

        {posts.length === 0 && (
          <p className="text-sm text-gray-600">暂无文章。</p>
        )}
      </div>
    </div>
  );
}

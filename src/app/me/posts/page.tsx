import Link from "next/link";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { deleteMyPost } from "./actions";

export default async function MyPostsPage() {
  const session = await requireUser();

  const posts = await prisma.post.findMany({
    where: { authorId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, status: true, updatedAt: true },
  });

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">我的文章</h1>
        <Link className="rounded border px-3 py-1" href="/me/posts/new">
          写文章
        </Link>
      </div>

      <div className="mt-6 space-y-3">
        {posts.map((p) => (
          <div key={p.id} className="rounded border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold">{p.title}</div>
                <div className="text-xs text-gray-600">
                  {p.status} · {p.updatedAt.toLocaleString()}
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  className="rounded border px-3 py-1"
                  href={`/me/posts/${p.id}`}
                >
                  编辑
                </Link>
                <form action={deleteMyPost}>
                  <input type="hidden" name="postId" value={p.id} />
                  <button className="rounded border px-3 py-1">删除</button>
                </form>
              </div>
            </div>
          </div>
        ))}
        {posts.length === 0 && (
          <p className="text-sm text-gray-600">还没有文章，去写一篇吧。</p>
        )}
      </div>
    </div>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      isPinned: true,
      publishedAt: true,
    },
  });

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">博客</h1>
        <div className="flex gap-2">
          <Link className="rounded border px-3 py-1" href="/me/posts">
            写作中心
          </Link>
          <Link className="rounded border px-3 py-1" href="/admin">
            后台
          </Link>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {posts.map((p) => (
          <Link
            key={p.id}
            href={`/posts/${p.slug}`}
            className="block rounded border p-4 hover:bg-gray-50"
          >
            <div className="font-semibold">
              {p.isPinned ? "📌 " : ""}
              {p.title}
            </div>
            <div className="mt-1 text-xs text-gray-600">
              {p.publishedAt ? new Date(p.publishedAt).toLocaleString() : ""}
            </div>
          </Link>
        ))}
        {posts.length === 0 && (
          <p className="text-sm text-gray-600">暂无已发布文章。</p>
        )}
      </div>
    </div>
  );
}

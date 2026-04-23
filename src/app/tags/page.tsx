import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function TagsPage() {
  // 取热门标签（按文章数排序）
  const tags = await prisma.tag.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      _count: { select: { posts: true } },
    },
    orderBy: { posts: { _count: "desc" } },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-bold">全部标签</h1>
      <Link className="rounded border px-3 py-1" href="/tags">
        标签
      </Link>
      <div className="mt-6 flex flex-wrap gap-2">
        {tags.map((t) => (
          <Link
            key={t.id}
            href={`/tags/${t.slug}`}
            className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
          >
            {t.name}
            <span className="ml-2 text-xs text-gray-600">
              ({t._count.posts})
            </span>
          </Link>
        ))}
      </div>

      {tags.length === 0 && (
        <p className="mt-6 text-sm text-gray-600">暂无标签。</p>
      )}
    </div>
  );
}

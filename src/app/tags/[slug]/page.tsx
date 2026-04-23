import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const tag = await prisma.tag.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true },
  });
  if (!tag) notFound();

  const posts = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      tags: { some: { tagId: tag.id } },
    },
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      publishedAt: true,
    },
  });

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">标签：{tag.name}</h1>
        <Link className="text-sm underline" href="/tags">
          查看全部标签
        </Link>
      </div>

      <div className="mt-6 space-y-3">
        {posts.map((p) => (
          <Link
            key={p.id}
            href={`/posts/${p.slug}`}
            className="block rounded border p-4 hover:bg-gray-50"
          >
            <div className="font-semibold">{p.title}</div>
            <div className="mt-1 text-xs text-gray-600">
              {p.publishedAt ? new Date(p.publishedAt).toLocaleString() : ""}
            </div>
          </Link>
        ))}
        {posts.length === 0 && (
          <p className="text-sm text-gray-600">暂无文章。</p>
        )}
      </div>
    </div>
  );
}

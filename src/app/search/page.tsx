import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

const PAGE_SIZE = 10;

type Row = {
  id: string;
  title: string;
  slug: string;
  publishedAt: Date | null;
  snippet: string;
  rank: number;
};

function Snippet({ text }: { text: string }) {
  const parts = text.split("[[[");
  return (
    <span>
      {parts.map((p, i) => {
        if (i === 0) return <span key={i}>{p}</span>;
        const [hit, rest = ""] = p.split("]]]");
        return (
          <span key={i}>
            <mark>{hit}</mark>
            {rest}
          </span>
        );
      })}
    </span>
  );
}

function parseQuery(q: string) {
  const keyword = q.trim();

  // tag:xxx
  if (keyword.toLowerCase().startsWith("tag:")) {
    return { mode: "tag" as const, value: keyword.slice(4).trim() };
  }
  // author:xxx
  if (keyword.toLowerCase().startsWith("author:")) {
    return { mode: "author" as const, value: keyword.slice(7).trim() };
  }

  return { mode: "fulltext" as const, value: keyword };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  const raw = (q ?? "").trim();
  const currentPage = Math.max(1, Number(page ?? "1") || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;

  const parsed = parseQuery(raw);

  // 统一返回结构：items + hasMore
  let items: Array<{
    id: string;
    title: string;
    slug: string;
    publishedAt: Date | null;
    snippet: string;
  }> = [];
  let hasMore = false;

  // ============ 1) 标签搜索 ============
  if (parsed.mode === "tag") {
    const tagKeyword = parsed.value;
    if (tagKeyword) {
      const rows = await prisma.post.findMany({
        where: {
          status: "PUBLISHED",
          tags: {
            some: {
              tag: { name: { contains: tagKeyword, mode: "insensitive" } },
            },
          },
        },
        orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
        take: PAGE_SIZE + 1,
        skip: offset,
        select: {
          id: true,
          title: true,
          slug: true,
          content: true,
          publishedAt: true,
        },
      });

      hasMore = rows.length > PAGE_SIZE;
      const pageRows = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

      items = pageRows.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        publishedAt: p.publishedAt,
        snippet: p.content.slice(0, 120),
      }));
    }
  }

  // ============ 2) 作者搜索 ============
  if (parsed.mode === "author") {
    const email = parsed.value;
    if (email) {
      const rows = await prisma.post.findMany({
        where: {
          status: "PUBLISHED",
          author: { email: { equals: email, mode: "insensitive" } },
        },
        orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
        take: PAGE_SIZE + 1,
        skip: offset,
        select: {
          id: true,
          title: true,
          slug: true,
          content: true,
          publishedAt: true,
        },
      });

      hasMore = rows.length > PAGE_SIZE;
      const pageRows = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

      items = pageRows.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        publishedAt: p.publishedAt,
        snippet: p.content.slice(0, 120),
      }));
    }
  }

  // ============ 3) 全文搜索（FTS + 高亮）+ 短词降级 ============
  if (parsed.mode === "fulltext") {
    const keyword = parsed.value;

    if (keyword.length >= 2) {
      const rows: Row[] = await prisma.$queryRaw<Row[]>(
        Prisma.sql`
          SELECT
            p.id,
            p.title,
            p.slug,
            p."publishedAt" as "publishedAt",
            ts_rank_cd(p.search_vector, plainto_tsquery('simple', ${keyword})) as rank,
            ts_headline(
              'simple',
              p.content,
              plainto_tsquery('simple', ${keyword}),
              'MaxWords=35, MinWords=12, ShortWord=2, StartSel=[[[, StopSel=]]]'
            ) as snippet
          FROM "Post" p
          WHERE p.status = 'PUBLISHED'
            AND p.search_vector @@ plainto_tsquery('simple', ${keyword})
          ORDER BY rank DESC, p."publishedAt" DESC NULLS LAST, p.id DESC
          LIMIT ${PAGE_SIZE + 1} OFFSET ${offset}
        `,
      );

      hasMore = rows.length > PAGE_SIZE;
      const pageRows = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

      items = pageRows.map((r) => ({
        id: r.id,
        title: r.title,
        slug: r.slug,
        publishedAt: r.publishedAt,
        snippet: r.snippet,
      }));
    } else if (keyword.length > 0) {
      // 短词降级：contains（避免 FTS 噪声）
      const rows = await prisma.post.findMany({
        where: {
          status: "PUBLISHED",
          OR: [
            { title: { contains: keyword, mode: "insensitive" } },
            { content: { contains: keyword, mode: "insensitive" } },
          ],
        },
        orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
        take: PAGE_SIZE + 1,
        skip: offset,
        select: {
          id: true,
          title: true,
          slug: true,
          content: true,
          publishedAt: true,
        },
      });

      hasMore = rows.length > PAGE_SIZE;
      const pageRows = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

      items = pageRows.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        publishedAt: p.publishedAt,
        snippet: p.content.slice(0, 120),
      }));
    }
  }

  const showPager = raw.length > 0;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-bold">搜索</h1>

      <form className="mt-4">
        <input
          name="q"
          defaultValue={raw}
          className="w-full rounded border p-2"
          placeholder="支持：关键词 / tag:xxx / author:xxx"
        />
      </form>

      <div className="mt-6 space-y-3">
        {items.map((p) => (
          <Link
            key={p.id}
            href={`/posts/${p.slug}`}
            className="block rounded border p-4 hover:bg-gray-50"
          >
            <div className="font-semibold">{p.title}</div>
            <div className="mt-1 text-xs text-gray-600">
              {p.publishedAt ? new Date(p.publishedAt).toLocaleString() : ""}
            </div>

            <div className="mt-2 text-sm text-gray-700">
              {/* FTS 的 snippet 有 [[[ ]]] 高亮标记；降级 contains 就是普通字符串 */}
              {p.snippet.includes("[[[") ? (
                <Snippet text={p.snippet} />
              ) : (
                p.snippet
              )}
            </div>
          </Link>
        ))}

        {raw && items.length === 0 && (
          <p className="text-sm text-gray-600">没有找到结果。</p>
        )}
      </div>

      {showPager && (
        <div className="mt-6 flex items-center gap-3">
          {currentPage > 1 && (
            <Link
              className="rounded border px-3 py-1 text-sm"
              href={`/search?q=${encodeURIComponent(raw)}&page=${currentPage - 1}`}
            >
              ← 上一页
            </Link>
          )}
          {hasMore && (
            <Link
              className="rounded border px-3 py-1 text-sm"
              href={`/search?q=${encodeURIComponent(raw)}&page=${currentPage + 1}`}
            >
              下一页 →
            </Link>
          )}
          <span className="text-sm text-gray-600">第 {currentPage} 页</span>
        </div>
      )}
    </div>
  );
}

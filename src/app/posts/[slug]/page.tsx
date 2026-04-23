import Link from "next/link";
import { notFound } from "next/navigation";

// import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import CommentForm from "./CommentForm";
import { deleteComment } from "./actions";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

import { getPublicPostBySlug } from "@/lib/post-queries";
export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  // const isAdmin = session?.user?.role === "ADMIN";

  // const post = await prisma.post.findFirst({
  //   where: { slug, status: "PUBLISHED" },
  //   select: {
  //     id: true,
  //     title: true,
  //     content: true,
  //     publishedAt: true,
  //     author: { select: { email: true, name: true } },
  //     comments: {
  //       where: isAdmin ? {} : { status: "VISIBLE" },
  //       orderBy: { createdAt: "desc" },
  //       select: {
  //         id: true,
  //         content: true,
  //         createdAt: true,
  //         authorId: true,
  //         status: true,
  //         reason: true,
  //         author: { select: { email: true, name: true } },
  //       },
  //     },
  //   },
  // });

  const post = await getPublicPostBySlug(slug);

  if (!post) notFound();

  const meId = session?.user?.id;
  const meRole = session?.user?.role;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <Link className="text-sm underline" href="/">
        ← 返回首页
      </Link>

      <h1 className="mt-4 text-2xl font-bold">{post.title}</h1>
      <div className="mt-2 text-xs text-gray-600">
        作者：{post.author.name ?? post.author.email} ·{" "}
        {post.publishedAt ? new Date(post.publishedAt).toLocaleString() : ""}
      </div>
      {post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {post.tags.map((t) => (
            <Link
              key={t.tag.slug}
              href={`/tags/${t.tag.slug}`}
              className="rounded bg-gray-100 px-2 py-0.5 text-xs hover:bg-gray-200"
            >
              {t.tag.name}
            </Link>
          ))}
        </div>
      )}

      {/* DONE 先用纯文本展示，后面我们再升级 Markdown/富文本 */}
      <article className="prose mt-6 max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSanitize]}
        >
          {post.content}
        </ReactMarkdown>
      </article>

      <hr className="my-8" />

      <h2 className="text-lg font-bold">评论</h2>

      {session?.user ? (
        <CommentForm postId={post.id} slug={slug} />
      ) : (
        <p className="mt-3 text-sm text-gray-600">
          想发表评论？请先{" "}
          <Link className="underline" href="/login">
            登录
          </Link>
        </p>
      )}

      <div className="mt-6 space-y-3">
        {post.comments.map((c) => {
          const canDelete = meRole === "ADMIN" || (meId && c.authorId === meId);

          return (
            <div key={c.id} className="rounded border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">
                    {c.author.name ?? c.author.email}
                  </div>
                  <div className="mt-1 whitespace-pre-wrap text-sm">
                    {c.content}
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    {new Date(c.createdAt).toLocaleString()}
                  </div>
                </div>

                {canDelete && (
                  <form action={deleteComment}>
                    <input type="hidden" name="commentId" value={c.id} />
                    <input type="hidden" name="slug" value={slug} />
                    <button className="rounded border px-3 py-1 text-sm">
                      删除
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}

        {post.comments.length === 0 && (
          <p className="text-sm text-gray-600">还没有评论，来做第一个吧。</p>
        )}
      </div>
    </div>
  );
}

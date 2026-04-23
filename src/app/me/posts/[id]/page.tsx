import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import EditPostForm from "./EditPostForm";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireUser();
  const { id } = await params;

  const post = await prisma.post.findFirst({
    where: { id, authorId: session.user.id },
    select: {
      id: true,
      title: true,
      content: true,
      status: true,
      tags: { select: { tag: { select: { name: true } } } },
    },
  });

  if (!post) {
    return <div className="p-6">文章不存在或无权限。</div>;
  }

  const tagsText = post.tags.map((t) => t.tag.name).join(", ");

  return (
    <div className="mx-auto max-w-5xl p-6">
      <EditPostForm
        post={{
          id: post.id,
          title: post.title,
          content: post.content,
          status: post.status,
        }}
        tagsText={tagsText}
        meRole={session.user.role}
      />
    </div>
  );
}

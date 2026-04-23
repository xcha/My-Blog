import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const session = await requireAdmin();

  const [userCount, postCount, commentCount] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.comment.count(),
  ]);

  return (
    <div>
      <h1 className="text-xl font-bold">管理员后台</h1>
      <p className="mt-2 text-sm text-gray-600">
        当前管理员：{session.user.email}（{session.user.role}）
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat title="用户数" value={userCount} />
        <Stat title="文章数" value={postCount} />
        <Stat title="评论数" value={commentCount} />
      </div>
    </div>
  );
}

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

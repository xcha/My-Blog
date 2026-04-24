import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex gap-6">
        <aside className="w-56 shrink-0">
          <div className="rounded border p-4">
            <div className="font-bold">Admin</div>
            <nav className="mt-3 flex flex-col gap-2 text-sm">
              <Link className="text-sm underline" href="/">
                ← 返回首页
              </Link>
              <Link className="underline" href="/admin">
                概览
              </Link>
              <Link className="underline" href="/admin/posts">
                文章管理
              </Link>
              <Link className="underline" href="/admin/users">
                用户管理
              </Link>
              <Link className="underline" href="/admin/comments">
                评论管理
              </Link>
              <Link className="underline" href="/admin/uploads">
                图片管理
              </Link>
              <Link className="underline" href="/admin/audit">
                审计日志
              </Link>
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

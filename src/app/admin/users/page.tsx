import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { setUserRole } from "./actions";

export default async function AdminUsersPage() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  return (
    <div>
      <h1 className="text-xl font-bold">用户管理</h1>
      <p className="mt-2 text-sm text-gray-600">
        这里演示 RBAC：只有管理员可访问，并且所有写操作在服务端校验。
      </p>

      <div className="mt-6 overflow-x-auto rounded border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">邮箱</th>
              <th className="p-3">昵称</th>
              <th className="p-3">角色</th>
              <th className="p-3">注册时间</th>
              <th className="p-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.name ?? "-"}</td>
                <td className="p-3 font-mono">{u.role}</td>
                <td className="p-3">{u.createdAt.toLocaleString()}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    {u.role !== "ADMIN" ? (
                      <form action={setUserRole}>
                        <input type="hidden" name="userId" value={u.id} />
                        <input type="hidden" name="role" value="ADMIN" />
                        <button className="rounded border px-3 py-1 hover:bg-gray-50">
                          升为管理员
                        </button>
                      </form>
                    ) : (
                      <form action={setUserRole}>
                        <input type="hidden" name="userId" value={u.id} />
                        <input type="hidden" name="role" value="USER" />
                        <button className="rounded border px-3 py-1 hover:bg-gray-50">
                          降为用户
                        </button>
                      </form>
                    )}
                  </div>

                  {/* 难点提示：生产里建议加“禁止降级最后一个管理员”等保护 */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export default async function AdminAuditPage() {
  await requireAdmin();

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      action: true,
      targetType: true,
      targetId: true,
      meta: true,
      createdAt: true,
      actor: { select: { email: true } },
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">审计日志</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          记录关键管理操作，便于追溯与排查问题（最近 200 条）。
        </p>
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-3 text-left">时间</th>
              <th className="p-3 text-left">操作者</th>
              <th className="p-3 text-left">动作</th>
              <th className="p-3 text-left">目标</th>
              <th className="p-3 text-left">Meta</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t">
                <td className="p-3">
                  {new Date(l.createdAt).toLocaleString()}
                </td>
                <td className="p-3">{l.actor.email}</td>
                <td className="p-3 font-mono">{l.action}</td>
                <td className="p-3">
                  {l.targetType ?? "-"} {l.targetId ? `#${l.targetId}` : ""}
                </td>
                <td className="p-3">
                  <pre className="max-w-[520px] overflow-auto text-xs">
                    {l.meta ? JSON.stringify(l.meta, null, 2) : "-"}
                  </pre>
                </td>
              </tr>
            ))}

            {logs.length === 0 && (
              <tr>
                <td
                  className="p-6 text-center text-sm text-muted-foreground"
                  colSpan={5}
                >
                  暂无日志
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

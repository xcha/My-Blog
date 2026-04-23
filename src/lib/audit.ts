import "server-only";
import { prisma } from "@/lib/prisma";

export async function auditLog(params: {
  actorId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  meta?: Record<string, unknown>;
}) {
  const { actorId, action, targetType, targetId, meta } = params;

  await prisma.auditLog.create({
    data: {
      actorId,
      action,
      targetType,
      targetId,
      meta: meta ?? undefined,
    },
  });
}

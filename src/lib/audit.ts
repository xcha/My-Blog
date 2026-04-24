import "server-only";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export async function auditLog(params: {
  actorId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  meta?: Prisma.InputJsonValue;
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

import { prisma } from '@/lib/db';
import type { Prisma } from '@/lib/generated/prisma/client';

export async function logAudit(input: {
  actorId?: string;
  action: string;
  entity: string;
  entityId: string;
  meta?: Record<string, unknown>;
}) {
  return prisma.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      meta: input.meta as Prisma.InputJsonValue | undefined,
    },
  });
}

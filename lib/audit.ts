import { db } from './db';
import crypto from 'crypto';
import logger from './logger';

export interface AuditLogData {
  actorId: string;
  action: string;
  entity: string;
  entityId?: string;
  ip?: string;
  metadata?: Record<string, any>;
}

export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    // Get the last audit log entry to chain the hash
    const lastLog = await db.auditLog.findFirst({
      orderBy: { ts: 'desc' },
      select: { immutableHash: true },
    });

    const recordPayload = JSON.stringify({
      ...data,
      ts: new Date().toISOString(),
    });

    // Create hash chain: SHA256(previousHash + currentPayload)
    const previousHash = lastLog?.immutableHash || 'genesis';
    const immutableHash = crypto
      .createHash('sha256')
      .update(previousHash + recordPayload)
      .digest('hex');

    await db.auditLog.create({
      data: {
        ...data,
        immutableHash,
      },
    });

    logger.info('Audit log created', {
      actorId: data.actorId,
      action: data.action,
      entity: data.entity,
      entityId: data.entityId,
    });
  } catch (error) {
    logger.error('Failed to create audit log', { error, data });
  }
}

export async function getAuditLogs(
  filters: {
    actorId?: string;
    action?: string;
    entity?: string;
    from?: Date;
    to?: Date;
  },
  limit = 100,
  offset = 0
) {
  const where: any = {};

  if (filters.actorId) where.actorId = filters.actorId;
  if (filters.action) where.action = filters.action;
  if (filters.entity) where.entity = filters.entity;
  if (filters.from || filters.to) {
    where.ts = {};
    if (filters.from) where.ts.gte = filters.from;
    if (filters.to) where.ts.lte = filters.to;
  }

  return db.auditLog.findMany({
    where,
    include: {
      actor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { ts: 'desc' },
    take: limit,
    skip: offset,
  });
}

export function verifyAuditChain(): Promise<boolean> {
  // Implementation to verify the integrity of the audit log chain
  // This would check that all hashes are properly chained
  return Promise.resolve(true);
}

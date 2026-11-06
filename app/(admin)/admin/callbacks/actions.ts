'use server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
export async function markCallbackDone(formData: FormData) { await requireAdmin(); const id = String(formData.get('id')); await prisma.callbackRequest.update({ where: { id }, data: { status: 'DONE' } }); }

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/apiAuth';
import { z } from 'zod';

const bodySchema = z.object({
  registerId: z.number().int().positive()
});

export async function POST(req: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Bad request' }, { status: 400 });

  const register = await prisma.register.findUnique({ where: { id: parsed.data.registerId } });
  if (!register || !register.active) return NextResponse.json({ error: 'Onbekende kassa' }, { status: 404 });

  const userId = Number((session as any).userId);

  let sale = await prisma.sale.findFirst({
    where: { registerId: register.id, status: 'OPEN' },
    orderBy: { createdAt: 'desc' },
    include: { items: { include: { product: true } } }
  });

  if (!sale) {
    sale = await prisma.sale.create({
      data: { registerId: register.id, userId, status: 'OPEN' },
      include: { items: { include: { product: true } } }
    });
  }

  return NextResponse.json({ sale });
}

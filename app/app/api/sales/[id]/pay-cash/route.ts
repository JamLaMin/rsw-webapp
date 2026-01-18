import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/apiAuth';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const saleId = Number(params.id);
  if (!Number.isFinite(saleId) || saleId <= 0) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const sale = await prisma.sale.findUnique({ where: { id: saleId }, include: { items: true } });
  if (!sale) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (sale.status !== 'OPEN') return NextResponse.json({ error: 'Already closed' }, { status: 409 });

  await prisma.sale.update({
    where: { id: saleId },
    data: { status: 'PAID', paidAt: new Date() }
  });

  const paid = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { items: { include: { product: true } }, register: true, user: true }
  });

  return NextResponse.json({ sale: paid });
}

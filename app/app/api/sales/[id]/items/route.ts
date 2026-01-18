import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/apiAuth';
import { z } from 'zod';

const bodySchema = z.object({
  productId: z.number().int().positive().optional(),
  barcode: z.string().min(1).optional(),
  qty: z.number().int().positive().max(99).optional()
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const saleId = Number(params.id);
  if (!Number.isFinite(saleId) || saleId <= 0) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Bad request' }, { status: 400 });

  const { productId, barcode, qty } = parsed.data;
  if (!productId && !barcode) return NextResponse.json({ error: 'Bad request' }, { status: 400 });

  const sale = await prisma.sale.findUnique({ where: { id: saleId } });
  if (!sale) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (sale.status !== 'OPEN') return NextResponse.json({ error: 'Sale is closed' }, { status: 409 });

  const product = await prisma.product.findFirst({
    where: productId ? { id: productId, active: true } : { barcode: barcode!, active: true }
  });
  if (!product) return NextResponse.json({ error: 'Onbekend product' }, { status: 404 });

  const addQty = qty ?? 1;

  const existing = await prisma.saleItem.findFirst({ where: { saleId, productId: product.id } });

  if (existing) {
    await prisma.saleItem.update({
      where: { id: existing.id },
      data: { qty: existing.qty + addQty }
    });
  } else {
    await prisma.saleItem.create({
      data: { saleId, productId: product.id, qty: addQty, unitPriceCents: product.priceCents }
    });
  }

  const updated = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { items: { include: { product: true }, orderBy: { createdAt: 'asc' } } }
  });

  return NextResponse.json({ sale: updated });
}

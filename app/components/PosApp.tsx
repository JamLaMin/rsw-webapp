'use client';

import { signOut } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';
import BarcodeCatcher from '@/components/BarcodeCatcher';

type Product = {
  id: number;
  name: string;
  priceCents: number;
  barcode: string | null;
  imageUrl: string | null;
};

type SaleItem = {
  id: number;
  productId: number;
  qty: number;
  unitPriceCents: number;
  product: Product;
};

type Sale = {
  id: number;
  status: 'OPEN' | 'PAID';
  registerId: number;
  items: SaleItem[];
};

function eur(cents: number) {
  return (cents / 100).toFixed(2).replace('.', ',');
}

export default function PosApp({ userName }: { userName: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [registerId, setRegisterId] = useState<number>(1);
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const totalCents = useMemo(() => {
    if (!sale) return 0;
    return sale.items.reduce((sum, it) => sum + it.qty * it.unitPriceCents, 0);
  }, [sale]);

  useEffect(() => {
    const saved = window.localStorage.getItem('rsw_registerId');
    if (saved) {
      const n = Number(saved);
      if (Number.isFinite(n) && n > 0) setRegisterId(n);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem('rsw_registerId', String(registerId));
  }, [registerId]);

  async function loadProducts() {
    const res = await fetch('/api/products');
    if (!res.ok) {
      throw new Error('Products laden mislukt');
    }
    const json = await res.json();
    setProducts(json.products);
  }

  async function openSale() {
    const res = await fetch('/api/sales/open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registerId })
    });
    if (!res.ok) throw new Error('Afrekening openen mislukt');
    const json = await res.json();
    setSale(json.sale);
  }

  async function refreshSale() {
    if (!sale) return;
    const res = await fetch(`/api/sales/${sale.id}`);
    if (!res.ok) return;
    const json = await res.json();
    setSale(json.sale);
  }

  useEffect(() => {
    let timer: any;
    (async () => {
      try {
        setLoading(true);
        await loadProducts();
        await openSale();
      } catch (e: any) {
        setToast(e?.message || 'Er ging iets mis');
      } finally {
        setLoading(false);
      }
    })();

    timer = setInterval(() => {
      refreshSale();
    }, 2000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerId]);

  async function addByProductId(productId: number) {
    if (!sale) return;
    const res = await fetch(`/api/sales/${sale.id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, qty: 1 })
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      setToast(json?.error || 'Toevoegen mislukt');
      return;
    }
    setSale(json.sale);
  }

  async function addByBarcode(code: string) {
    if (!sale) return;
    const res = await fetch(`/api/sales/${sale.id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barcode: code, qty: 1 })
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      setToast(json?.error || 'Onbekende barcode');
      return;
    }
    setSale(json.sale);
  }

  async function payCash() {
    if (!sale) return;
    const res = await fetch(`/api/sales/${sale.id}/pay-cash`, { method: 'POST' });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      setToast(json?.error || 'Betalen mislukt');
      return;
    }
    setToast(`Betaald: € ${eur(totalCents)}`);
    await openSale();
  }

  return (
    <div className="min-h-screen">
      <BarcodeCatcher onBarcode={addByBarcode} />

      <div className="flex items-center justify-between px-4 py-3 bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="text-lg font-semibold">Scanner webapp</div>
          <div className="text-sm text-gray-500">Ingelogd als {userName}</div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">Kassa</label>
          <select
            className="border rounded-xl px-3 py-2"
            value={registerId}
            onChange={(e) => setRegisterId(Number(e.target.value))}
          >
            <option value={1}>Kassa 1</option>
            <option value={2}>Kassa 2</option>
          </select>

          <button
            className="rounded-xl border px-3 py-2"
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            Uitloggen
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-2">
            <div className="bg-white rounded-2xl shadow p-4 space-y-3">
              <button
                className="w-full rounded-2xl border px-4 py-4 text-left"
                onClick={() => setToast('Opwaarderen komt als volgende stap.')}
              >
                <div className="text-base font-semibold">Opwaarderen</div>
                <div className="text-xs text-gray-500 mt-1">(placeholder)</div>
              </button>

              <button
                className="w-full rounded-2xl border px-4 py-4 text-left"
                onClick={payCash}
                disabled={!sale || sale.items.length === 0}
              >
                <div className="text-base font-semibold">Contant</div>
                <div className="text-xs text-gray-500 mt-1">Afrekenen en reset</div>
              </button>

              <div className="text-xs text-gray-500 leading-relaxed">
                Barcode scanner werkt als toetsenbord.
                Scan een productbarcode en druk Enter.
              </div>
            </div>
          </div>

          <div className="col-span-12 md:col-span-6">
            <div className="bg-white rounded-2xl shadow p-4">
              <div className="text-base font-semibold">Afrekenen</div>

              {loading ? (
                <div className="text-sm text-gray-500 mt-3">Laden...</div>
              ) : (
                <div className="mt-3 overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500">
                        <th className="py-2 w-12">#</th>
                        <th className="py-2">Consumptie</th>
                        <th className="py-2 w-24 text-right">Prijs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sale?.items?.map((it, idx) => (
                        <tr key={it.id} className="border-t">
                          <td className="py-2">{idx + 1}</td>
                          <td className="py-2">
                            {it.product.name} x{it.qty}
                          </td>
                          <td className="py-2 text-right">€ {eur(it.qty * it.unitPriceCents)}</td>
                        </tr>
                      ))}

                      <tr className="border-t">
                        <td className="py-3" />
                        <td className="py-3 text-gray-500">Totaal</td>
                        <td className="py-3 text-right font-semibold">€ {eur(totalCents)}</td>
                      </tr>
                    </tbody>
                  </table>

                  {sale && sale.items.length === 0 ? (
                    <div className="text-sm text-gray-400 mt-6">Nog geen items.</div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          <div className="col-span-12 md:col-span-4">
            <div className="bg-white rounded-2xl shadow p-4">
              <div className="flex items-center justify-between">
                <div className="text-base font-semibold">Consumpties</div>
                <button
                  className="text-xs text-gray-500 underline"
                  onClick={() => refreshSale()}
                >
                  verversen
                </button>
              </div>

              <div className="mt-3 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                {products.map((p) => (
                  <button
                    key={p.id}
                    className="rounded-2xl overflow-hidden border bg-white hover:shadow transition"
                    onClick={() => addByProductId(p.id)}
                  >
                    <div className="h-24 bg-gray-50 flex items-center justify-center">
                      <img src={p.imageUrl || ''} alt={p.name} className="h-24 w-full object-cover" />
                    </div>
                    <div className="p-2">
                      <div className="text-sm font-semibold truncate">{p.name}</div>
                      <div className="text-xs text-gray-600">€ {eur(p.priceCents)}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast ? (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-xl shadow" onClick={() => setToast(null)}>
          {toast}
        </div>
      ) : null}
    </div>
  );
}

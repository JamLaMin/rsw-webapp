'use client';

import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const callbackUrl = search.get('callbackUrl') || '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn('credentials', {
      redirect: false,
      username,
      password,
      callbackUrl
    });

    setLoading(false);

    if (!res || res.error) {
      setError('Inloggen mislukt. Controleer je gegevens.');
      return;
    }

    router.push(callbackUrl);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6">
        <div className="text-2xl font-semibold">RSW Kassa</div>
        <div className="text-sm text-gray-500 mt-1">Log in om te starten.</div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-700">Gebruikersnaam</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Wachtwoord</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}

          <button
            className="w-full rounded-xl bg-black text-white py-2 disabled:opacity-50"
            disabled={loading}
            type="submit"
          >
            {loading ? 'Bezig...' : 'Inloggen'}
          </button>

          <div className="text-xs text-gray-500 leading-relaxed">
            Standaard gebruikers na eerste start.
            <div>admin / admin123</div>
            <div>kassa / kassa123</div>
          </div>
        </form>
      </div>
    </div>
  );
}

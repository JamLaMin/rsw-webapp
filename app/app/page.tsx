import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import PosApp from '@/components/PosApp';

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  return <PosApp userName={session.user?.name || 'Gebruiker'} />;
}

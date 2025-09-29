import { Shell } from '@/components/Shell';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
// UserRole import removed - using normalized Role from lib/roles

interface CommanderLayoutProps {
  children: React.ReactNode;
  params: {
    locale: string;
  };
}

export default async function CommanderLayout({
  children,
  params: { locale },
}: CommanderLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(`/${locale}/auth/login`);
  }

  const userRole = session.user.role;

  // Check if user has commander access
  if (userRole !== 'commander' && userRole !== 'super_admin' && userRole !== 'admin') {
    redirect(`/${locale}/unauthorized`);
  }

  return <Shell>{children}</Shell>;
}

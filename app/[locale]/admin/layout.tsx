import { Shell } from '@/components/Shell';
import { getServerSession } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
// UserRole import removed - using normalized Role from lib/roles

interface AdminLayoutProps {
  children: React.ReactNode;
  params: {
    locale: string;
  };
}

export default async function AdminLayout({
  children,
  params: { locale },
}: AdminLayoutProps) {
  const session = await getServerSession();

  if (!session) {
    redirect(`/${locale}/auth/login`);
  }

  const userRole = session.user.role;
  
  // Check if user has admin access
  if (!['super_admin', 'admin'].includes(userRole)) {
    redirect(`/${locale}/unauthorized`);
  }

  return <Shell>{children}</Shell>;
}

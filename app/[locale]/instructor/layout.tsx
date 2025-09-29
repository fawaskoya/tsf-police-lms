import { Shell } from '@/components/Shell';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
// UserRole import removed - using normalized Role from lib/roles

interface InstructorLayoutProps {
  children: React.ReactNode;
  params: {
    locale: string;
  };
}

export default async function InstructorLayout({
  children,
  params: { locale },
}: InstructorLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(`/${locale}/auth/login`);
  }

  const userRole = session.user.role;

  // Check if user has instructor access
  if (userRole !== 'instructor' && userRole !== 'super_admin' && userRole !== 'admin') {
    redirect(`/${locale}/unauthorized`);
  }

  return <Shell>{children}</Shell>;
}

import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function SystemDesignLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (!session || role !== 'super_admin') {
    redirect('/admin/dashboard');
  }

  return <>{children}</>;
}


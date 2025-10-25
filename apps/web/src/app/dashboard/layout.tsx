import { getServerSession } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import { AppLayoutClient } from '@/components/app-layout-client';

const AppLayout = async ({ children }: { children: React.ReactNode }) => {
  // const session = await getServerSession();
  // if (!session) {
  //   console.log('No session, redirecting to login');
  //   return redirect('/auth/login');
  // }
  
  return <AppLayoutClient>{children}</AppLayoutClient>;
};

export default AppLayout;

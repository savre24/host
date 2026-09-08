import HorizontalLayout from '@/components/layout/HorizontalLayout';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import { redirect } from 'next/navigation';

const ClientLayout = async ({ children }) => {
  const session = await getServerSession(options);

  if (!session) {
    redirect('/auth/login');
  }

  if (session?.user?.role !== 'CLIENT') {
    redirect('/dashboard');
  }

  return (
    <HorizontalLayout>
      {children}
    </HorizontalLayout>
  );
};

export default ClientLayout;

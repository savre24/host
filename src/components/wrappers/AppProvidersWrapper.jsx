'use client';

import { ToastContainer } from 'react-toastify';
import dynamic from 'next/dynamic';
import { EmailProvider } from '@/context/useEmailContext';
import { SessionProvider } from 'next-auth/react';
const LayoutProvider = dynamic(() => import('@/context/useLayoutContext').then(mod => mod.LayoutProvider), {
  ssr: false
});
const AppProvidersWrapper = ({
  children
}) => {
  return <>
      <SessionProvider>
        <LayoutProvider>
          <EmailProvider>
            {children}
            <ToastContainer theme="colored" />
          </EmailProvider>
        </LayoutProvider>
      </SessionProvider>
    </>;
};
export default AppProvidersWrapper;
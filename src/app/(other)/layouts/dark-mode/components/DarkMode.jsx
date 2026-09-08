'use client';

import VerticalLayout from '@/components/layout/VerticalLayout';
import { useLayoutContext } from '@/context/useLayoutContext';
import { useEffect } from 'react';
const DarkMode = () => {
  const {
    changeTheme
  } = useLayoutContext();
  useEffect(() => {
    changeTheme('dark');
  }, []);
  return <VerticalLayout>
      <div />
    </VerticalLayout>;
};
export default DarkMode;
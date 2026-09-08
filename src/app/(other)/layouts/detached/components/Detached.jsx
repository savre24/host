'use client';

import VerticalLayout from '@/components/layout/VerticalLayout';
import { useLayoutContext } from '@/context/useLayoutContext';
import { useEffect } from 'react';
const Detached = () => {
  const {
    changeLayoutMode
  } = useLayoutContext();
  useEffect(() => {
    changeLayoutMode('detached');
  }, []);
  return <>
    <VerticalLayout>
      <div />
    </VerticalLayout>
  </>;
};
export default Detached;
'use client';

import VerticalLayout from '@/components/layout/VerticalLayout';
import { useLayoutContext } from '@/context/useLayoutContext';
import { useEffect } from 'react';
const FullView = () => {
  const {
    changeMenu
  } = useLayoutContext();
  useEffect(() => {
    changeMenu.size('full');
  }, []);
  return <>
      <VerticalLayout>
        <div />
      </VerticalLayout>
    </>;
};
export default FullView;
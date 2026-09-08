'use client';

import VerticalLayout from '@/components/layout/VerticalLayout';
import { useLayoutContext } from '@/context/useLayoutContext';
import { useEffect } from 'react';
const IconView = () => {
  const {
    changeMenu
  } = useLayoutContext();
  useEffect(() => {
    changeMenu.size('condensed');
  }, []);
  return <>
      <VerticalLayout>
        <div />
      </VerticalLayout>
    </>;
};
export default IconView;
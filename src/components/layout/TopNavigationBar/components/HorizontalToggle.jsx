'use client';

import IconifyIcon from '@/components/wrappers/IconifyIcon';
import { useLayoutContext } from '@/context/useLayoutContext';
const HorizontalToggle = () => {
  const {
    horizontalMenu
  } = useLayoutContext();
  return <>
      <button onClick={horizontalMenu.toggle} className="topnav-toggle-button px-2">
        <IconifyIcon icon='tabler:menu-deep' className="fs-22" />
      </button>
    </>;
};
export default HorizontalToggle;
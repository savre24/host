'use client';

import { useEffect, useState } from 'react';
import logoDark from '@/assets/images/logo-dark.png';
import logoSm from '@/assets/images/logo-sm.png';
import logo from '@/assets/images/logo.png';
import Image from 'next/image';
import { getBusinessSetting } from '@/app/actions/settings';

const LogoBox = () => {
  const [customLogo, setCustomLogo] = useState(null);
  const [customIcon, setCustomIcon] = useState(null);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const { data } = await getBusinessSetting();
        if (data?.logoUrl) {
          setCustomLogo(data.logoUrl);
        }
        if (data?.iconUrl) {
          setCustomIcon(data.iconUrl);
        }
      } catch (error) {
        console.error('Failed to load logo:', error);
      }
    };
    fetchLogo();
  }, []);

  return <a href="/" className="logo">
      <span className="logo-light">
        <span className="logo-lg">
          {customLogo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={customLogo} alt="logo" style={{ height: 'auto', maxHeight: '50px', maxWidth: '220px', objectFit: 'contain', verticalAlign: 'middle' }} />
          ) : (
            <Image width={109} height={22} src={logo} alt="logo" />
          )}
        </span>
        <span className="logo-sm">
          {customIcon ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={customIcon} alt="small logo" style={{ height: 'auto', maxHeight: '30px', maxWidth: '50px', objectFit: 'contain', verticalAlign: 'middle' }} />
          ) : (
            <Image width={19} height={24} src={logoSm} alt="small logo" />
          )}
        </span>
      </span>
      <span className="logo-dark">
        <span className="logo-lg">
          {customLogo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={customLogo} alt="logo" style={{ height: 'auto', maxHeight: '50px', maxWidth: '220px', objectFit: 'contain', verticalAlign: 'middle' }} />
          ) : (
            <Image width={109} height={22} src={logoDark} alt="dark logo" />
          )}
        </span>
        <span className="logo-sm">
          {customIcon ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={customIcon} alt="small logo" style={{ height: 'auto', maxHeight: '30px', maxWidth: '50px', objectFit: 'contain', verticalAlign: 'middle' }} />
          ) : (
            <Image width={19} height={24} src={logoSm} alt="small logo" />
          )}
        </span>
      </span>
    </a>;
};
export default LogoBox;
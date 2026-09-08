'use client';

import Image from 'next/image';
import React from 'react';
import avatar1 from '@/assets/images/users/avatar-1.jpg';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import { Dropdown, DropdownHeader, DropdownItem, DropdownMenu, DropdownToggle } from 'react-bootstrap';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

const ProfileDropdown = () => {
  const { data: session } = useSession();
  const userName = session?.user?.name || 'Admin User';
  const userRole = session?.user?.role || 'Administrator';
  const userImage = session?.user?.image || avatar1;

  return <div className="topbar-item nav-user">
      <Dropdown>
        <DropdownToggle as={'a'} className="topbar-link drop-arrow-none px-2" data-bs-toggle="dropdown" data-bs-offset="0,19" type="button" aria-haspopup="false" aria-expanded="false">
          {typeof userImage === 'string' ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={userImage} width={32} height={32} style={{ objectFit: 'cover' }} className="rounded-circle me-lg-2 d-flex" alt="user-image" />
          ) : (
            <Image src={userImage} width={32} height={32} style={{ objectFit: 'cover' }} className="rounded-circle me-lg-2 d-flex" alt="user-image" />
          )}
          <span className="d-lg-flex flex-column gap-1 d-none text-start">
            <h5 className="my-0">{userName}</h5>
            <h6 className="my-0 fw-normal text-muted text-capitalize">{userRole.toLowerCase()}</h6>
          </span>
          <IconifyIcon icon='tabler:chevron-down' className="d-none d-lg-block align-middle ms-2" />
        </DropdownToggle>
        <DropdownMenu className="dropdown-menu-end">
          <DropdownHeader className="noti-title">
            <h6 className="text-overflow m-0">Welcome !</h6>
          </DropdownHeader>
          <DropdownItem as={Link} href={userRole.toUpperCase() === 'ADMIN' ? "/profile" : "/client/profile"}>
            <IconifyIcon icon='tabler:user-hexagon' className=" me-1 fs-17 align-middle" />
            <span className="align-middle">My Account</span>
          </DropdownItem>
          {userRole.toUpperCase() === 'ADMIN' && (
            <DropdownItem as={Link} href="/settings">
              <IconifyIcon icon='tabler:settings' className=" me-1 fs-17 align-middle" />
              <span className="align-middle">Settings</span>
            </DropdownItem>
          )}
          <DropdownItem as={Link} href={userRole.toUpperCase() === 'ADMIN' ? "/support" : "/client/support"}>
            <IconifyIcon icon='tabler:lifebuoy' className=" me-1 fs-17 align-middle" />
            <span className="align-middle">Support</span>
          </DropdownItem>
          <div className="dropdown-divider" />
          <DropdownItem as={Link} href="/auth/lock-screen">
            <IconifyIcon icon='tabler:lock-square-rounded' className="me-1 fs-17 align-middle" />
            <span className="align-middle">Lock Screen</span>
          </DropdownItem>
          <DropdownItem onClick={() => signOut({ callbackUrl: '/auth/login' })} className="active fw-semibold text-danger" style={{ cursor: 'pointer' }}>
            <IconifyIcon icon='tabler:logout' className="me-1 fs-17 align-middle" />
            <span className="align-middle">Sign Out</span>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>;
};
export default ProfileDropdown;
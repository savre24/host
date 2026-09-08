import React from 'react';
import logoDark from '@/assets/images/logo-dark.png';
import logo from '@/assets/images/logo.png';
import Image from 'next/image';
import avatar1 from '@/assets/images/users/avatar-1.jpg';
import { currentYear } from '@/context/constants';
import { Card, Col, Row } from 'react-bootstrap';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import { getBusinessSetting } from '@/app/actions/settings';

export const metadata = {
  title: 'Logout'
};

const LogoutPage = async () => {
  const session = await getServerSession(options);
  const userName = session?.user?.name || 'Admin User';
  const userImage = session?.user?.image || avatar1;
  const { data: businessSetting } = await getBusinessSetting();
  const customLogo = businessSetting?.logoUrl || null;
  const companyName = businessSetting?.companyName || 'Greeva';

  return (
    <div className="auth-bg d-flex min-vh-100 justify-content-center align-items-center">
      <Row className="g-0 justify-content-center w-100 m-xxl-5 px-xxl-4 m-3">
        <Col xl={4} lg={5} md={6}>
          <Card className="overflow-hidden text-center h-100 p-xxl-4 p-3 mb-0">
            <a href="/" className="auth-brand mb-4 d-flex justify-content-center">
              {customLogo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={customLogo} alt="logo" style={{ maxHeight: '40px', width: 'auto', objectFit: 'contain' }} />
              ) : (
                <>
                  <Image src={logoDark} alt="dark logo" height={26} className="logo-dark" />
                  <Image src={logo} alt="logo light" height={26} className="logo-light" />
                </>
              )}
            </a>
            <h4 className="fw-semibold mb-2 fs-18">You are Logged Out</h4>
            
            <div className="d-flex align-items-center gap-2 my-3 mx-auto">
              {typeof userImage === 'string' ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={userImage} alt='avatar' className="avatar-lg rounded-circle img-thumbnail" style={{ objectFit: 'cover' }} />
              ) : (
                <Image src={userImage} alt='avatar' className="avatar-lg rounded-circle img-thumbnail" style={{ objectFit: 'cover' }} />
              )}
              <div>
                <h4 className="fw-semibold text-dark m-0">See You Again!</h4>
                <p className="text-muted m-0">{userName}</p>
              </div>
            </div>
            
            <div className="mb-3 text-start">
              <div className="bg-success-subtle p-3 rounded fst-italic fw-medium mb-0" role="alert">
                <p className="mb-0 text-success">You have been successfully logged out of your account. To continue using our services, please log in again with your credentials.</p>
              </div>
            </div>
            
            <div className="d-grid mb-3">
              <Link href="/auth/login" className="btn btn-primary fw-semibold">Back to Login</Link>
            </div>
            
            <p className="mt-auto mb-0">
             {currentYear} © {companyName}
            </p>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
export default LogoutPage;
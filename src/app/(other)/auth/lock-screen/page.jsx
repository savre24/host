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
  title: 'Lock Screen'
};

const LockScreenPage = async () => {
  const session = await getServerSession(options);
  const userName = session?.user?.name || 'Dhanoo K.';
  const userImage = session?.user?.image || avatar1;
  const { data: businessSetting } = await getBusinessSetting();
  const customLogo = businessSetting?.logoUrl || null;
  const companyName = businessSetting?.companyName || 'Greeva';

  return <div className="auth-bg d-flex min-vh-100 justify-content-center align-items-center">
      <Row className="g-0 justify-content-center w-100 m-xxl-5 px-xxl-4 m-3">
        <Col xl={4} lg={5} md={6}>
          <Card className="overflow-hidden text-center h-100 p-xxl-4 p-4 mb-0">
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
            <div className="text-center">
              {typeof userImage === 'string' ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={userImage} alt='avatar' className="avatar-xl rounded-circle img-thumbnail" style={{ objectFit: 'cover' }} />
              ) : (
                <Image src={userImage} alt='avatar' className="avatar-xl rounded-circle img-thumbnail" style={{ objectFit: 'cover' }} />
              )}
              <div className="mt-2 mb-3">
                <h4 className="fw-semibold text-dark">Hi ! {userName}</h4>
                <p className="mb-0 fst-italic">Please input your password to access the screen. </p>
              </div>
            </div>
            <form action="/" className="text-start mb-3">
              <div className="mb-3">
                <label className="form-label" htmlFor="lock-password">Enter Password</label>
                <input type="password" id="lock-password" name="lock-password" className="form-control" placeholder="Password" />
              </div>
              <div className="mb-2 d-grid">
                <button className="btn btn-primary fw-semibold" type="submit">Access to Screen</button>
              </div>
            </form>
            <p className="text-muted fs-14 mb-4">Back To <Link href="/auth/login" className="fw-semibold text-danger ms-1">Login !</Link></p>
            <p className="mt-auto mb-0">
             {currentYear} © {companyName}
            </p>
          </Card>
        </Col>
      </Row>
    </div>;
};
export default LockScreenPage;
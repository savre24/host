import { getUserProfile } from '@/app/actions/profile';
import ProfileForm from '@/components/ProfileForm';
import { Row, Col } from 'react-bootstrap';

export const metadata = {
  title: 'My Account'
};

export default async function ProfilePage() {
  const { data: user } = await getUserProfile();

  return (
    <>
      <div className="row">
        <div className="col-12">
          <div className="page-title-box">
            <h4 className="page-title">My Account</h4>
          </div>
        </div>
      </div>
      <Row>
        <Col xl={8} lg={10}>
          <ProfileForm initialData={user || {}} />
        </Col>
      </Row>
    </>
  );
}

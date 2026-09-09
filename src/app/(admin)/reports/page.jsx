import PageTitle from '@/components/PageTitle';
import ReportsClient from './ReportsClient';
import { Row, Col } from 'react-bootstrap';

export const metadata = {
  title: 'Reports',
};

export default function ReportsPage() {
  return (
    <>
      <PageTitle title="Reports" subTitle="Dashboard" />
      <Row>
        <Col xs={12}>
          <ReportsClient />
        </Col>
      </Row>
    </>
  );
}

import { getClientDashboardStats } from '@/app/actions/client-portal';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import PageTitle from '@/components/PageTitle';
import { Col, Row, Card, CardBody } from 'react-bootstrap';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import Link from 'next/link';

export const metadata = {
  title: 'Client Dashboard'
};

const StatCard = ({ title, value, icon, link, colorClass }) => (
  <Card>
    <CardBody>
      <div className="d-flex align-items-center justify-content-between">
        <div>
          <h4 className="fw-medium text-muted mb-2">{title}</h4>
          <h2 className="mb-0 fw-bold">{value}</h2>
        </div>
        <div className={`avatar-md bg-${colorClass}-subtle text-${colorClass} rounded d-flex align-items-center justify-content-center fs-24`}>
          <IconifyIcon icon={icon} />
        </div>
      </div>
      <div className="mt-4">
        <Link href={link} className="text-primary fw-medium fs-14">
          View details <IconifyIcon icon="tabler:arrow-right" className="ms-1 fs-16" />
        </Link>
      </div>
    </CardBody>
  </Card>
);

const ClientDashboard = async () => {
  const session = await getServerSession(options);
  const { data: stats, error } = await getClientDashboardStats(session?.user?.id);

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <>
      <PageTitle title={`Welcome back, ${session?.user?.name?.split(' ')[0] || 'Client'}!`} subTitle='Dashboard' />
      
      <Row className="mb-4">
        <Col md={4} className="mb-3 mb-md-0">
          <StatCard 
            title="Active Services" 
            value={stats.activeServices} 
            icon="tabler:device-imac" 
            link="/client/services" 
            colorClass="primary" 
          />
        </Col>
        <Col md={4} className="mb-3 mb-md-0">
          <StatCard 
            title="Pending Balance" 
            value={`₹${stats.pendingBalance.toFixed(2)}`} 
            icon="tabler:file-invoice" 
            link="/client/invoices" 
            colorClass="danger" 
          />
        </Col>
        <Col md={4}>
          <StatCard 
            title="Open Support Tickets" 
            value={stats.openTickets} 
            icon="tabler:headset" 
            link="/client/support" 
            colorClass="warning" 
          />
        </Col>
      </Row>

      <Row>
        <Col lg={12}>
          <Card>
            <CardBody>
              <h5 className="mb-3">Quick Actions</h5>
              <div className="d-flex flex-wrap gap-3">
                <Link href="/client/support/create" className="btn btn-primary">
                  <IconifyIcon icon="tabler:headset" className="me-2" /> Open a Support Ticket
                </Link>
                <Link href="/client/invoices" className="btn btn-outline-secondary">
                  <IconifyIcon icon="tabler:file-invoice" className="me-2" /> View Billing History
                </Link>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default ClientDashboard;

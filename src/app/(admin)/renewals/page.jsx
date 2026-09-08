import { getUpcomingRenewals } from '@/app/actions/product';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import PageTitle from '@/components/PageTitle';
import Link from 'next/link';
import { Col, Row, Table, Badge } from 'react-bootstrap';
import RenewalActions from './RenewalActions';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

export const metadata = {
  title: 'Renewals Dashboard',
};

const calculateDaysRemaining = (expiryDate) => {
  if (!expiryDate) return null;
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const getUrgencyBadge = (days) => {
  if (days < 0) return <Badge bg="danger">Expired by {Math.abs(days)} days</Badge>;
  if (days === 0) return <Badge bg="danger">Expires Today</Badge>;
  if (days <= 7) return <Badge bg="danger">In {days} days</Badge>;
  if (days <= 30) return <Badge bg="warning">In {days} days</Badge>;
  return <Badge bg="info">In {days} days</Badge>;
};

const RenewalsPage = async ({ searchParams }) => {
  // We can filter by days if a query param is passed, default to 60 days to give a good window
  const days = parseInt(searchParams?.days || '60', 10);
  
  const { data: services, error } = await getUpcomingRenewals(days);

  const expiredCount = services?.filter(s => calculateDaysRemaining(s.expiryDate) < 0).length || 0;
  const upcomingCount = services?.filter(s => calculateDaysRemaining(s.expiryDate) >= 0 && calculateDaysRemaining(s.expiryDate) <= 30).length || 0;

  return (
    <>
      <PageTitle title="Renewals Dashboard" subTitle="Dashboard" />

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={4}>
          <div className="card text-center">
            <div className="card-body">
              <div className="avatar-sm mx-auto mb-3">
                <span className="avatar-title bg-danger-subtle text-danger rounded-circle fs-3">
                  <IconifyIcon icon="tabler:alert-triangle" />
                </span>
              </div>
              <h4 className="mb-1 text-danger">{expiredCount}</h4>
              <p className="text-muted mb-0">Expired Services</p>
            </div>
          </div>
        </Col>
        <Col md={4}>
          <div className="card text-center">
            <div className="card-body">
              <div className="avatar-sm mx-auto mb-3">
                <span className="avatar-title bg-warning-subtle text-warning rounded-circle fs-3">
                  <IconifyIcon icon="tabler:clock" />
                </span>
              </div>
              <h4 className="mb-1 text-warning">{upcomingCount}</h4>
              <p className="text-muted mb-0">Expiring in next 30 days</p>
            </div>
          </div>
        </Col>
        <Col md={4}>
          <div className="card text-center">
            <div className="card-body">
              <div className="avatar-sm mx-auto mb-3">
                <span className="avatar-title bg-info-subtle text-info rounded-circle fs-3">
                  <IconifyIcon icon="tabler:calendar" />
                </span>
              </div>
              <h4 className="mb-1 text-info">{services?.length || 0}</h4>
              <p className="text-muted mb-0">Total Tracking (within {days} days)</p>
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        <Col xs={12}>
          <ComponentContainerCard 
            title="Upcoming & Overdue Renewals" 
            description="Manage services approaching their expiry dates. Services are ordered by urgency."
            action={
              <div className="d-flex gap-2">
                <Link href="/renewals?days=30" className={`btn btn-sm ${days === 30 ? 'btn-primary' : 'btn-outline-primary'}`}>30 Days</Link>
                <Link href="/renewals?days=60" className={`btn btn-sm ${days === 60 ? 'btn-primary' : 'btn-outline-primary'}`}>60 Days</Link>
                <Link href="/renewals?days=365" className={`btn btn-sm ${days === 365 ? 'btn-primary' : 'btn-outline-primary'}`}>All Year</Link>
              </div>
            }
          >
            {error ? (
              <div className="alert alert-danger">{error}</div>
            ) : (
              <Table responsive className="mb-0 table-striped align-middle">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Service</th>
                    <th>Price</th>
                    <th>Expiry Date</th>
                    <th>Time Remaining</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(services || []).map((svc) => {
                    const daysRemaining = calculateDaysRemaining(svc.expiryDate);
                    return (
                      <tr key={svc.id}>
                        <td>
                          <Link href={`/clients/${svc.client.user.id}`} className="text-primary fw-medium">
                            {svc.client.user.name || svc.client.companyName}
                          </Link>
                        </td>
                        <td>
                          <div>{svc.product?.name}</div>
                          {svc.customName && <small className="text-muted">{svc.customName}</small>}
                        </td>
                        <td>₹{svc.price.toFixed(2)} / {svc.billingCycle.replace('_', ' ')}</td>
                        <td>{new Date(svc.expiryDate).toLocaleDateString()}</td>
                        <td>{getUrgencyBadge(daysRemaining)}</td>
                        <RenewalActions service={svc} />
                      </tr>
                    );
                  })}
                  {services?.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-4">
                        No upcoming renewals found for this timeframe!
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            )}
          </ComponentContainerCard>
        </Col>
      </Row>
    </>
  );
};

export default RenewalsPage;

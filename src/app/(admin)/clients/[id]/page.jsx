import { getClientById } from '@/app/actions/client';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import PageTitle from '@/components/PageTitle';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Col, Row, Table } from 'react-bootstrap';
import ClientServiceActions from './ClientServiceActions';
import CopyWhatsAppButton from './CopyWhatsAppButton';

export const metadata = {
  title: 'Client Details',
};

const ClientViewPage = async ({ params }) => {
  const { id } = params;
  const { data: client, error } = await getClientById(id);

  if (error || !client) {
    notFound();
  }

  const profile = client.clientProfile || {};

  return (
    <>
      <PageTitle title="Client Details" subTitle="Clients" />
      <Row className="mb-3">
        <Col className="d-flex justify-content-between">
          <Link href="/clients" className="btn btn-outline-secondary">
            <IconifyIcon icon="tabler:arrow-left" width={18} height={18} className="me-1" /> Back to Clients
          </Link>
          <Link href={`/clients/${id}/edit`} className="btn btn-primary">
            <IconifyIcon icon="tabler:pencil" width={18} height={18} className="me-1" /> Edit Client
          </Link>
        </Col>
      </Row>

      <Row>
        <Col lg={4}>
          <div className="card mb-4">
            <div className="card-body text-center">
              <div className="avatar-xl mx-auto mb-3">
                <span className="avatar-title bg-primary-subtle text-primary rounded-circle display-4">
                  {client.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <h4 className="mb-1">{client.name}</h4>
              <p className="text-muted">{profile.companyName}</p>
              
              <div className="mt-4 text-start">
                <h6 className="text-uppercase text-muted mb-3">Contact Information</h6>
                <p className="mb-2"><strong>Email:</strong> {client.email}</p>
                <p className="mb-2"><strong>Phone:</strong> {profile.phone || 'N/A'}</p>
                <p className="mb-2"><strong>Address:</strong> {profile.address || 'N/A'}</p>
                <p className="mb-2"><strong>Status:</strong> {profile.loginStatus ? <span className="badge bg-success">Active</span> : <span className="badge bg-danger">Disabled</span>}</p>
                <p className="mb-2"><strong>Joined:</strong> {new Date(client.createdAt).toLocaleDateString()}</p>
              </div>

              <div className="mt-4 text-start">
                <h6 className="text-uppercase text-muted mb-3">Billing Overview</h6>
                <div className="p-3 bg-light rounded d-flex justify-content-between align-items-center">
                  <span className="fw-medium text-muted">Total Pending</span>
                  <h4 className="mb-0 text-danger">₹{profile.invoices ? profile.invoices.filter(i => i.status === 'PENDING' || i.status === 'PARTIALLY_PAID').reduce((sum, inv) => sum + inv.total, 0).toFixed(2) : '0.00'}</h4>
                </div>
              </div>

              {profile.notes && (
                <div className="mt-4 text-start">
                  <h6 className="text-uppercase text-muted mb-3">Internal Notes</h6>
                  <p className="mb-0 text-muted">{profile.notes}</p>
                </div>
              )}
            </div>
          </div>
        </Col>

        <Col lg={8}>
          <ComponentContainerCard 
            title="Services & Subscriptions" 
            className="mb-4"
            action={
              <Link href={`/clients/${id}/assign`} className="btn btn-sm btn-primary">
                <IconifyIcon icon="tabler:plus" className="me-1" /> Assign Service
              </Link>
            }
          >
            {profile.services && profile.services.length > 0 ? (
              <Table responsive className="mb-0">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Status</th>
                    <th>Start Date</th>
                    <th>Next Renewal</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.services.map((svc) => (
                    <tr key={svc.id}>
                      <td>
                        <div className="fw-medium">{svc.product?.name || 'Unknown Service'}</div>
                        {svc.customName && (
                          <div className="text-muted small mt-1">{svc.customName}</div>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${svc.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}`}>
                          {svc.status}
                        </span>
                      </td>
                      <td>{new Date(svc.startDate).toLocaleDateString()}</td>
                      <td>{svc.expiryDate ? new Date(svc.expiryDate).toLocaleDateString() : 'N/A'}</td>
                      <ClientServiceActions serviceId={svc.id} clientId={id} />
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <p className="text-muted mb-0">No active services assigned to this client.</p>
            )}
          </ComponentContainerCard>

          <ComponentContainerCard 
            title="Recent Invoices" 
            className="mb-4"
            action={
              <div className="d-flex align-items-center">
                <CopyWhatsAppButton client={client} invoices={profile.invoices} />
                <Link href="/invoices/create" className="btn btn-sm btn-outline-primary">
                  <IconifyIcon icon="tabler:plus" className="me-1" /> New Invoice
                </Link>
              </div>
            }
          >
            {profile.invoices && profile.invoices.length > 0 ? (
              <Table responsive className="mb-0">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td>{inv.invoiceNumber}</td>
                      <td>{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                      <td className="fw-medium text-primary">₹{inv.total.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${
                          inv.status === 'PAID' ? 'bg-success' : 
                          inv.status === 'PENDING' ? 'bg-warning' : 
                          inv.status === 'PARTIALLY_PAID' ? 'bg-info' : 'bg-secondary'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="text-center">
                        <Link href={`/invoices/${inv.id}`} className="btn btn-sm btn-outline-info">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <p className="text-muted mb-0">No invoices generated for this client yet.</p>
            )}
          </ComponentContainerCard>

          <ComponentContainerCard title="Recent Support Tickets">
            {client.supportTickets && client.supportTickets.length > 0 ? (
              <Table responsive className="mb-0">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {client.supportTickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td>{ticket.subject}</td>
                      <td>{ticket.status}</td>
                      <td>{ticket.priority}</td>
                      <td>{new Date(ticket.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <p className="text-muted mb-0">No support tickets found.</p>
            )}
          </ComponentContainerCard>
        </Col>
      </Row>
    </>
  );
};

export default ClientViewPage;

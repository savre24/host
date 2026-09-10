import { getClientServiceById } from '@/app/actions/product';
import { notFound } from 'next/navigation';
import DomainActionsClient from './DomainActionsClient';
import DomainInfoEditableClient from './DomainInfoEditableClient';
import Link from 'next/link';
import PageTitle from '@/components/PageTitle';

export const metadata = {
  title: 'Service Details'
};

export default async function ClientServiceDetailsPage({ params }) {
  const { id } = await params;
  
  const { data: service, error } = await getClientServiceById(id);
  
  if (error || !service) {
    return notFound();
  }

  const isDomain = service.product?.category?.toUpperCase() === 'DOMAIN';
  const serviceName = service.customName || service.product?.name;

  return (
    <>
      <PageTitle title={serviceName} subTitle="Services" />

      <div className="row">
        <div className="col-xl-8 col-lg-10">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <h4 className="header-title m-0">Service Overview</h4>
                <span className={`badge ${
                  service.status === 'ACTIVE' ? 'bg-success' : 
                  service.status === 'EXPIRING_SOON' ? 'bg-warning' : 
                  service.status === 'EXPIRED' ? 'bg-danger' : 'bg-secondary'
                }`}>
                  {service.status.replace('_', ' ')}
                </span>
              </div>

              <div className="mb-4">
                <p><strong>Service Type:</strong> {service.product?.name}</p>
                <p><strong>Billing Cycle:</strong> {service.billingCycle.replace('_', ' ')}</p>
                <p><strong>Start Date:</strong> {new Date(service.startDate).toLocaleDateString()}</p>
                {service.expiryDate && (
                  <p><strong>Expiration Date:</strong> {new Date(service.expiryDate).toLocaleDateString()}</p>
                )}
                <p><strong>Price:</strong> ₹{service.price.toFixed(2)}</p>
              </div>

              {isDomain && (
                <>
                  <hr />
                  <div className="position-relative">
                    <h4 className="header-title my-3">Domain Information</h4>
                  </div>
                  
                  <DomainInfoEditableClient 
                    serviceId={service.id} 
                    initialDns={service.domainDetail?.dnsNameservers} 
                    initialOwnership={service.domainDetail?.domainOwnership} 
                  />

                  <DomainActionsClient serviceId={service.id} domainName={serviceName} />
                </>
              )}

              {service.product?.category?.toUpperCase() === 'RADIO_SERVER' && service.radioServerDetail && (
                <>
                  <hr />
                  <div className="position-relative">
                    <h4 className="header-title my-3">Radio Server Details</h4>
                  </div>
                  <div className="bg-light p-3 rounded border">
                    {service.radioServerDetail.loginUrl && (
                      <p><strong>Login URL:</strong> <a href={service.radioServerDetail.loginUrl} target="_blank" rel="noopener noreferrer">{service.radioServerDetail.loginUrl}</a></p>
                    )}
                    {service.radioServerDetail.username && (
                      <p><strong>Username:</strong> {service.radioServerDetail.username}</p>
                    )}
                    {service.radioServerDetail.password && (
                      <p><strong>Password:</strong> {service.radioServerDetail.password}</p>
                    )}
                    {service.radioServerDetail.serverDetails && (
                      <div className="mt-3">
                        <strong>Configuration Details:</strong>
                        <pre className="bg-white p-2 border rounded mt-1" style={{ whiteSpace: 'pre-wrap' }}>
                          {service.radioServerDetail.serverDetails}
                        </pre>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

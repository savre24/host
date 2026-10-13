'use client';

import { useState } from 'react';
import { Card, CardBody, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

export default function ResellerClubDomainManageCard({ service }) {
  const isDomain = service?.product?.category === 'DOMAIN' || !!service?.domainDetail;
  const domainName = service?.customName || service?.domainDetail?.domainOwnership;

  const [renewing, setRenewing] = useState(false);
  const [result, setResult] = useState(null);

  if (!isDomain || !domainName) {
    return null;
  }

  // Detect TLD
  const parts = domainName.split('.');
  const tld = parts.length > 1 ? parts.slice(1).join('.').toLowerCase() : 'com';

  const wholesaleMap = {
    'com': 1179,
    'in': 789,
    'co.in': 699,
    'org': 1619,
  };
  const wholesaleCost = wholesaleMap[tld] || null;
  const clientRenewalPrice = service.renewalPrice || service.product?.renewalPrice || 0;
  const renewalMargin = wholesaleCost ? clientRenewalPrice - wholesaleCost : null;

  const handleRenew = async () => {
    if (!confirm(`Are you sure you want to renew ${domainName} for 1 year via ResellerClub?`)) {
      return;
    }

    setRenewing(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/domains/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainName,
          clientServiceId: service.id,
          years: 1,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Renewal failed');

      setResult({ type: 'success', text: `Domain ${domainName} successfully renewed!` });
    } catch (err) {
      setResult({ type: 'danger', text: err.message });
    } finally {
      setRenewing(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm mb-4">
      <CardBody className="p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center">
            <div className="avatar-sm bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center me-3 fs-20">
              <IconifyIcon icon="tabler:world" />
            </div>
            <div>
              <h5 className="fw-bold mb-0">ResellerClub Domain Management</h5>
              <span className="text-muted fs-12">Automated renewals & cost breakdown</span>
            </div>
          </div>
          <Badge bg="info-subtle" className="text-info px-2 py-1">
            .{tld}
          </Badge>
        </div>

        {result && (
          <Alert variant={result.type} dismissible onClose={() => setResult(null)}>
            {result.text}
          </Alert>
        )}

        <div className="bg-light rounded p-3 mb-3">
          <div className="row g-2">
            <div className="col-sm-6">
              <span className="text-muted fs-12 d-block">Domain Name</span>
              <strong className="fs-15 text-primary">{domainName}</strong>
            </div>
            <div className="col-sm-6">
              <span className="text-muted fs-12 d-block">Current Expiry</span>
              <strong className="fs-14">
                {service.expiryDate ? new Date(service.expiryDate).toLocaleDateString() : 'Not Set'}
              </strong>
            </div>
            <div className="col-sm-6 mt-2">
              <span className="text-muted fs-12 d-block">ResellerClub Wholesale Renewal Cost</span>
              <strong className="fs-14 text-danger">
                {wholesaleCost ? `₹${wholesaleCost.toFixed(2)}` : 'N/A'}
              </strong>
            </div>
            <div className="col-sm-6 mt-2">
              <span className="text-muted fs-12 d-block">Client Renewal Amount</span>
              <strong className="fs-14 text-success">
                ₹{clientRenewalPrice.toFixed(2)}
              </strong>
              {renewalMargin !== null && (
                <span className="badge bg-success-subtle text-success ms-2 fs-11">
                  Margin: +₹{renewalMargin.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-end">
          <Button
            variant="primary"
            size="sm"
            disabled={renewing}
            onClick={handleRenew}
            className="d-inline-flex align-items-center"
          >
            {renewing ? (
              <>
                <Spinner size="sm" className="me-1" /> Processing Renewal...
              </>
            ) : (
              <>
                <IconifyIcon icon="tabler:repeat" className="me-1" />
                Renew with ResellerClub (1 Year)
              </>
            )}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

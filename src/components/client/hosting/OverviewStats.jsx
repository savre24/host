"use client";

import { useState, useEffect } from "react";
import { Card, Row, Col, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { Icon } from '@iconify/react';
import Link from "next/link";

export function OverviewStats({ serviceId }) {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/client/hosting/${serviceId}/overview`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStats(data);
    } catch (error) {
      toast.error(error.message || "Failed to fetch website overview");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [serviceId]);

  if (isLoading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" variant="secondary" />
      </div>
    );
  }

  if (!stats) {
    return <p className="text-muted">Unable to fetch website overview.</p>;
  }

  return (
    <Row className="g-4">
      <Col md={6} lg={3}>
        <Card className="h-100">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0 text-muted">Domain</h6>
              <Icon icon="tabler:world" className="text-muted fs-4" />
            </div>
            <h4 className="fw-bold mb-1">{stats.domain}</h4>
            <Link href={`http://${stats.domain}`} target="_blank" className="text-primary text-decoration-none small d-flex align-items-center">
              Visit Website <Icon icon="tabler:arrow-up-right" className="ms-1" />
            </Link>
          </Card.Body>
        </Card>
      </Col>
      
      <Col md={6} lg={3}>
        <Card className="h-100">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0 text-muted">Status</h6>
              <Icon icon="tabler:activity" className="text-muted fs-4" />
            </div>
            <h4 className={`fw-bold mb-1 ${stats.state === 'Active' ? 'text-success' : 'text-danger'}`}>
              {stats.state}
            </h4>
            <p className="text-muted small mb-0">Package: {stats.package}</p>
          </Card.Body>
        </Card>
      </Col>

      <Col md={6} lg={3}>
        <Card className="h-100">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0 text-muted">Server IP</h6>
              <Icon icon="tabler:server" className="text-muted fs-4" />
            </div>
            <h4 className="fw-bold mb-1">{stats.ipAddress}</h4>
            <p className="text-muted small mb-0">PHP: {stats.phpVersion || 'N/A'}</p>
          </Card.Body>
        </Card>
      </Col>

      <Col md={6} lg={3}>
        <Card className="h-100">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0 text-muted">Disk Usage</h6>
              <Icon icon="tabler:device-floppy" className="text-muted fs-4" />
            </div>
            <h4 className="fw-bold mb-1">{stats.diskUsed || '0MB'}</h4>
            <p className="text-muted small mb-0">Total used space</p>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}

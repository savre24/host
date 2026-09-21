"use client";

import { useState, useEffect } from "react";
import { Button, Form, Card, Table, Spinner, Row, Col } from "react-bootstrap";
import { toast } from "react-toastify";
import { Icon } from '@iconify/react';

export function FTPManager({ serviceId }) {
  const [ftpAccounts, setFtpAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ ftpUsername: "", ftpPassword: "", path: "/" });

  const fetchFTPs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/client/hosting/${serviceId}/ftp`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFtpAccounts(data || []);
    } catch (error) {
      toast.error(error.message || "Failed to fetch FTP accounts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFTPs();
  }, [serviceId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/client/hosting/${serviceId}/ftp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CREATE", ...formData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success("FTP account created successfully");
      setFormData({ ftpUsername: "", ftpPassword: "", path: "/" });
      fetchFTPs();
    } catch (error) {
      toast.error(error.message || "Failed to create FTP account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (ftpUsername) => {
    if (!confirm(`Are you sure you want to delete FTP account ${ftpUsername}?`)) return;
    try {
      const res = await fetch(`/api/client/hosting/${serviceId}/ftp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DELETE", ftpUsername }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success("FTP account deleted successfully");
      fetchFTPs();
    } catch (error) {
      toast.error(error.message || "Failed to delete FTP account");
    }
  };

  return (
    <div>
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Create New FTP Account</h5>
          <small className="text-muted">Create a new FTP user to access your website files</small>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleCreate}>
            <Row className="mb-3">
              <Form.Group as={Col} md={4}>
                <Form.Label>FTP Username (suffix)</Form.Label>
                <Form.Control
                  value={formData.ftpUsername}
                  onChange={(e) => setFormData({ ...formData, ftpUsername: e.target.value })}
                  placeholder="ftp1"
                  required
                />
              </Form.Group>
              <Form.Group as={Col} md={4}>
                <Form.Label>Path (relative to /home/domain.com)</Form.Label>
                <Form.Control
                  value={formData.path}
                  onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                  placeholder="public_html"
                  required
                />
              </Form.Group>
              <Form.Group as={Col} md={4}>
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  value={formData.ftpPassword}
                  onChange={(e) => setFormData({ ...formData, ftpPassword: e.target.value })}
                  required
                />
              </Form.Group>
            </Row>
            <Button type="submit" disabled={isSubmitting} variant="primary">
              {isSubmitting && <Spinner animation="border" size="sm" className="me-2" />}
              Create FTP Account
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <h5 className="mb-0">Existing FTP Accounts</h5>
        </Card.Header>
        <Card.Body>
          {isLoading ? (
            <div className="text-center p-4">
              <Spinner animation="border" variant="secondary" />
            </div>
          ) : ftpAccounts.length === 0 ? (
            <p className="text-muted mb-0">No FTP accounts found.</p>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Path</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ftpAccounts.map((ftp, idx) => (
                  <tr key={idx}>
                    <td>{ftp.ftpUsername}</td>
                    <td>{ftp.path}</td>
                    <td className="text-end">
                      <Button variant="danger" size="sm" onClick={() => handleDelete(ftp.ftpUsername)}>
                        <Icon icon="tabler:trash" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Button, Form, Card, Table, Spinner, Row, Col } from "react-bootstrap";
import { toast } from "react-toastify";
import { Icon } from '@iconify/react';

export function DatabaseManager({ serviceId }) {
  const [databases, setDatabases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ dbName: "", dbUser: "", dbPassword: "" });

  const fetchDatabases = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/client/hosting/${serviceId}/databases`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDatabases(data || []);
    } catch (error) {
      toast.error(error.message || "Failed to fetch databases");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabases();
  }, [serviceId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/client/hosting/${serviceId}/databases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CREATE", ...formData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success("Database created successfully");
      setFormData({ dbName: "", dbUser: "", dbPassword: "" });
      fetchDatabases();
    } catch (error) {
      toast.error(error.message || "Failed to create database");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (dbName) => {
    if (!confirm(`Are you sure you want to delete database ${dbName}?`)) return;
    try {
      const res = await fetch(`/api/client/hosting/${serviceId}/databases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DELETE", dbName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success("Database deleted successfully");
      fetchDatabases();
    } catch (error) {
      toast.error(error.message || "Failed to delete database");
    }
  };

  return (
    <div>
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Create New Database</h5>
          <small className="text-muted">Create a new MySQL database and user</small>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleCreate}>
            <Row className="mb-3">
              <Form.Group as={Col} md={4}>
                <Form.Label>Database Name (suffix)</Form.Label>
                <Form.Control
                  value={formData.dbName}
                  onChange={(e) => setFormData({ ...formData, dbName: e.target.value })}
                  placeholder="db1"
                  required
                />
              </Form.Group>
              <Form.Group as={Col} md={4}>
                <Form.Label>Database User (suffix)</Form.Label>
                <Form.Control
                  value={formData.dbUser}
                  onChange={(e) => setFormData({ ...formData, dbUser: e.target.value })}
                  placeholder="user1"
                  required
                />
              </Form.Group>
              <Form.Group as={Col} md={4}>
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  value={formData.dbPassword}
                  onChange={(e) => setFormData({ ...formData, dbPassword: e.target.value })}
                  required
                />
              </Form.Group>
            </Row>
            <Button type="submit" disabled={isSubmitting} variant="primary">
              {isSubmitting && <Spinner animation="border" size="sm" className="me-2" />}
              Create Database
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <h5 className="mb-0">Existing Databases</h5>
        </Card.Header>
        <Card.Body>
          {isLoading ? (
            <div className="text-center p-4">
              <Spinner animation="border" variant="secondary" />
            </div>
          ) : databases.length === 0 ? (
            <p className="text-muted mb-0">No databases found.</p>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Database Name</th>
                  <th>Database User</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {databases.map((db, idx) => (
                  <tr key={idx}>
                    <td>{db.dbName}</td>
                    <td>{db.dbUser}</td>
                    <td className="text-end">
                      <Button variant="danger" size="sm" onClick={() => handleDelete(db.dbName)}>
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

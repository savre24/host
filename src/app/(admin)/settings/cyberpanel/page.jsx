'use client';

import { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Modal, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import CyberPanelSettingsForm from './CyberPanelSettingsForm';
import Link from 'next/link';

export default function CyberPanelSettingsPage() {
  const [servers, setServers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingServer, setEditingServer] = useState(null);
  const [testingId, setTestingId] = useState(null);

  const fetchServers = async () => {
    try {
      const res = await fetch('/api/cyberpanel/servers');
      const data = await res.json();
      if (data.success) {
        setServers(data.data);
      } else {
        toast.error(data.message || 'Failed to fetch servers');
      }
    } catch (err) {
      toast.error('Network error fetching servers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, []);

  const handleAdd = () => {
    setEditingServer(null);
    setShowModal(true);
  };

  const handleEdit = (server) => {
    setEditingServer(server);
    setShowModal(true);
  };

  const handleSuccess = () => {
    setShowModal(false);
    fetchServers();
  };

  const handleTestConnection = async (id) => {
    setTestingId(id);
    try {
      const res = await fetch(`/api/cyberpanel/servers/${id}/test`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Connection successful!');
      } else {
        toast.error(data.message || 'Connection failed');
      }
    } catch (err) {
      toast.error('Network error testing connection');
    } finally {
      setTestingId(null);
    }
  };

  const handleToggleActive = async (server) => {
    if (!server.isActive && !window.confirm('Are you sure you want to enable this server?')) return;
    if (server.isActive && !window.confirm('Are you sure you want to disable this server? It will stop new provisions on this server.')) return;

    try {
      const res = await fetch(`/api/cyberpanel/servers/${server.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: server.name,
          url: server.url,
          username: server.username,
          isActive: !server.isActive
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Server ${server.isActive ? 'disabled' : 'enabled'} successfully`);
        fetchServers();
      } else {
        toast.error(data.message || 'Failed to toggle status');
      }
    } catch (err) {
      toast.error('Network error updating server');
    }
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center p-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">CyberPanel Servers</h4>
          <p className="text-muted mb-0">Manage your connected CyberPanel instances</p>
        </div>
        <Button variant="primary" onClick={handleAdd}>
          <i className="ti ti-plus me-1"></i> Add Server
        </Button>
      </div>

      <Card>
        <Table responsive hover className="mb-0 align-middle">
          <thead className="bg-light">
            <tr>
              <th>Name</th>
              <th>URL</th>
              <th>Username</th>
              <th>Status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {servers.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4 text-muted">
                  No CyberPanel servers configured yet.
                </td>
              </tr>
            ) : (
              servers.map(server => (
                <tr key={server.id}>
                  <td className="fw-medium">{server.name}</td>
                  <td>
                    <a href={server.url} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                      {server.url}
                    </a>
                  </td>
                  <td>{server.username}</td>
                  <td>
                    <Badge bg={server.isActive ? 'success' : 'danger'}>
                      {server.isActive ? 'Active' : 'Disabled'}
                    </Badge>
                  </td>
                  <td className="text-end">
                    <Button 
                      variant="outline-info" 
                      size="sm" 
                      className="me-2"
                      onClick={() => handleTestConnection(server.id)}
                      disabled={testingId === server.id || !server.isActive}
                    >
                      {testingId === server.id ? (
                        <Spinner size="sm" />
                      ) : (
                        <i className="ti ti-plug"></i>
                      )} Test
                    </Button>
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      className="me-2"
                      onClick={() => handleEdit(server)}
                    >
                      <i className="ti ti-edit"></i> Edit
                    </Button>
                    <Button 
                      variant={server.isActive ? "outline-warning" : "outline-success"} 
                      size="sm"
                      onClick={() => handleToggleActive(server)}
                    >
                      <i className={`ti ${server.isActive ? 'ti-pause' : 'ti-play'}`}></i> 
                      {server.isActive ? ' Disable' : ' Enable'}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static" centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingServer ? 'Edit CyberPanel Server' : 'Add CyberPanel Server'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <CyberPanelSettingsForm 
            initialData={editingServer} 
            onSuccess={handleSuccess} 
            onCancel={() => setShowModal(false)} 
          />
        </Modal.Body>
      </Modal>
    </div>
  );
}

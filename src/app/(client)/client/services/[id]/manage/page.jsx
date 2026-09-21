"use client";

import { useState } from "react";
import { Tab, Tabs } from "react-bootstrap";
import { OverviewStats } from "@/components/client/hosting/OverviewStats";
import { DatabaseManager } from "@/components/client/hosting/DatabaseManager";
import { FTPManager } from "@/components/client/hosting/FTPManager";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Icon } from '@iconify/react';

export default function ManageHostingPage() {
  const params = useParams();
  const serviceId = params.id;
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Link href="/client/services" className="text-muted text-decoration-none d-flex align-items-center mb-2">
            <Icon icon="tabler:arrow-left" className="me-1" />
            Back to Services
          </Link>
          <h2 className="fw-bold mb-1">Manage Hosting</h2>
          <p className="text-muted">Manage your website, databases, and FTP accounts.</p>
        </div>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onSelect={(k) => setActiveTab(k)} 
        className="mb-4"
      >
        <Tab eventKey="overview" title="Overview">
          <OverviewStats serviceId={serviceId} />
        </Tab>
        <Tab eventKey="databases" title="Databases">
          <DatabaseManager serviceId={serviceId} />
        </Tab>
        <Tab eventKey="ftp" title="FTP Accounts">
          <FTPManager serviceId={serviceId} />
        </Tab>
      </Tabs>
    </div>
  );
}

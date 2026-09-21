"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewStats } from "@/components/client/hosting/OverviewStats";
import { DatabaseManager } from "@/components/client/hosting/DatabaseManager";
import { FTPManager } from "@/components/client/hosting/FTPManager";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ManageHostingPage() {
  const params = useParams();
  const serviceId = params.id;
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center text-sm text-muted-foreground mb-2">
            <Link href="/client/services" className="hover:text-primary flex items-center">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Services
            </Link>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Manage Hosting</h2>
          <p className="text-muted-foreground">
            Manage your website, databases, and FTP accounts.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="databases">Databases</TabsTrigger>
          <TabsTrigger value="ftp">FTP Accounts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <OverviewStats serviceId={serviceId} />
        </TabsContent>
        
        <TabsContent value="databases" className="space-y-4">
          <DatabaseManager serviceId={serviceId} />
        </TabsContent>
        
        <TabsContent value="ftp" className="space-y-4">
          <FTPManager serviceId={serviceId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

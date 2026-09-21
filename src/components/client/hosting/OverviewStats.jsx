"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, HardDrive, Globe, Server, Activity, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function OverviewStats({ serviceId }) {
  const { toast } = useToast();
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
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [serviceId]);

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!stats) {
    return <p className="text-muted-foreground">Unable to fetch website overview.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Domain</CardTitle>
          <Globe className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold">{stats.domain}</div>
          <Link href={`http://${stats.domain}`} target="_blank" className="text-xs text-primary flex items-center hover:underline mt-1">
            Visit Website <ArrowUpRight className="h-3 w-3 ml-1" />
          </Link>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Status</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.state === "Active" ? (
              <span className="text-green-500">Active</span>
            ) : (
              <span className="text-destructive">{stats.state}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Package: {stats.package}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Server IP</CardTitle>
          <Server className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.ipAddress}</div>
          <p className="text-xs text-muted-foreground">PHP: {stats.phpVersion || 'N/A'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
          <HardDrive className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.diskUsed || '0MB'}</div>
          <p className="text-xs text-muted-foreground">Total used space</p>
        </CardContent>
      </Card>
    </div>
  );
}

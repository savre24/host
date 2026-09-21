"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Trash2 } from "lucide-react";

export function FTPManager({ serviceId }) {
  const { toast } = useToast();
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
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
      
      toast({ title: "Success", description: "FTP account created successfully" });
      setFormData({ ftpUsername: "", ftpPassword: "", path: "/" });
      fetchFTPs();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
      
      toast({ title: "Success", description: "FTP account deleted successfully" });
      fetchFTPs();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New FTP Account</CardTitle>
          <CardDescription>Create a new FTP user to access your website files</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4 max-w-sm">
            <div className="space-y-2">
              <Label htmlFor="ftpUsername">FTP Username (suffix)</Label>
              <Input
                id="ftpUsername"
                value={formData.ftpUsername}
                onChange={(e) => setFormData({ ...formData, ftpUsername: e.target.value })}
                placeholder="ftp1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="path">Path (relative to /home/domain.com)</Label>
              <Input
                id="path"
                value={formData.path}
                onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                placeholder="public_html"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ftpPassword">Password</Label>
              <Input
                id="ftpPassword"
                type="password"
                value={formData.ftpPassword}
                onChange={(e) => setFormData({ ...formData, ftpPassword: e.target.value })}
                required
              />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create FTP Account
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing FTP Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : ftpAccounts.length === 0 ? (
            <p className="text-muted-foreground">No FTP accounts found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ftpAccounts.map((ftp, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{ftp.ftpUsername}</TableCell>
                    <TableCell>{ftp.path}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(ftp.ftpUsername)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

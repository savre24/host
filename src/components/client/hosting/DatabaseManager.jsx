"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Trash2 } from "lucide-react";

export function DatabaseManager({ serviceId }) {
  const { toast } = useToast();
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
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
      
      toast({ title: "Success", description: "Database created successfully" });
      setFormData({ dbName: "", dbUser: "", dbPassword: "" });
      fetchDatabases();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
      
      toast({ title: "Success", description: "Database deleted successfully" });
      fetchDatabases();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Database</CardTitle>
          <CardDescription>Create a new MySQL database and user</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4 max-w-sm">
            <div className="space-y-2">
              <Label htmlFor="dbName">Database Name (suffix)</Label>
              <Input
                id="dbName"
                value={formData.dbName}
                onChange={(e) => setFormData({ ...formData, dbName: e.target.value })}
                placeholder="db1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dbUser">Database User (suffix)</Label>
              <Input
                id="dbUser"
                value={formData.dbUser}
                onChange={(e) => setFormData({ ...formData, dbUser: e.target.value })}
                placeholder="user1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dbPassword">Password</Label>
              <Input
                id="dbPassword"
                type="password"
                value={formData.dbPassword}
                onChange={(e) => setFormData({ ...formData, dbPassword: e.target.value })}
                required
              />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Database
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Databases</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : databases.length === 0 ? (
            <p className="text-muted-foreground">No databases found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Database Name</TableHead>
                  <TableHead>Database User</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {databases.map((db, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{db.dbName}</TableCell>
                    <TableCell>{db.dbUser}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(db.dbName)}>
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

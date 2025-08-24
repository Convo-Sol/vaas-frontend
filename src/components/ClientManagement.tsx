import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Client {
  id: string;
  businessName: string;
  username: string;
  callRate: number;
  status: "Active" | "Inactive";
  autoPrint: boolean;
  totalCalls: number;
  totalRevenue: number;
}

export const ClientManagement = () => {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const [newClient, setNewClient] = useState<{
    businessName: string;
    username: string;
    email: string;
    password: string;
    callRate: number;
    autoPrint: boolean;
    logo: File | null; // Added logo property
  }>({
    businessName: "",
    username: "",
    email: "",
    password: "",
    callRate: 2.0,
    autoPrint: true,
    logo: null,
  });

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Fetch clients from database with real-time data
  const fetchClients = async () => {
    try {
      const { data: clientsData, error: clientsError } = await supabase
        .from('app_users')
        .select('*')
        .eq('user_type', 'business')
        .order('created_at', { ascending: false });

      if (clientsError) {
        toast({
          title: "Error",
          description: "Failed to fetch clients",
          variant: "destructive",
        });
        return;
      }

      // Fetch orders data for each client
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('business_user_id, call_duration');

      if (ordersError) {
        toast({
          title: "Error",
          description: "Failed to fetch orders data",
          variant: "destructive",
        });
        return;
      }

      // Process client data with real-time statistics
      const processedClients = clientsData?.map(user => {
        const clientOrders = ordersData?.filter(order => order.business_user_id === user.id) || [];
        const totalCalls = clientOrders.length;
        const totalRevenue = clientOrders.reduce((sum, order) => {
          const duration = order.call_duration || 0;
          const rate = user.call_rate || 0;
          return sum + (duration * rate);
        }, 0);

        return {
          id: user.id,
          businessName: user.business_name || "",
          username: user.username,
          callRate: user.call_rate || 0,
          status: user.is_active ? "Active" : "Inactive" as "Active" | "Inactive",
          autoPrint: user.auto_print || false,
          totalCalls,
          totalRevenue,
        };
      }) || [];

      setClients(processedClients);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch clients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleAddClient = async () => {
    if (!newClient.businessName || !newClient.username || !newClient.email || !newClient.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (Business Name, Username, Email, Password).",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Processing...",
        description: "Creating new client account. Please wait.",
      });

      let logoUrl: string | null = null;

      // Upload logo to Supabase storage if provided
      if (newClient.logo) {
        const fileExt = newClient.logo.name.split('.').pop();
        const fileName = `${newClient.username}-${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('brand_logo')
          .upload(fileName, newClient.logo, { upsert: true });

        if (uploadError) {
          throw new Error(`Logo Upload Error: ${uploadError.message}`);
        }

        // Get the public URL for the uploaded logo
        const { data: urlData } = supabase.storage
          .from('brand_logo')
          .getPublicUrl(fileName);
        logoUrl = urlData.publicUrl;
      }

      // Invoke the edge function to create the client
      const { error: functionError } = await supabase.functions.invoke('create-client', {
        body: {
          email: newClient.email,
          password: newClient.password,
          username: newClient.username,
          businessName: newClient.businessName,
          callRate: newClient.callRate,
          autoPrint: newClient.autoPrint,
          logoUrl: logoUrl,
        },
      });

      if (functionError) {
        throw functionError;
      }

      toast({
        title: "Client Added Successfully!",
        description: `${newClient.businessName} has been added to the system`,
      });

      // Refresh clients list
      await fetchClients();

      setNewClient({
        businessName: "",
        username: "",
        email: "",
        password: "",
        callRate: 2.0,
        autoPrint: true,
        logo: null,
      });
      setIsAddDialogOpen(false);
    } catch (error: any) {
      console.error("Client creation failed:", error);
      toast({
        title: "An Unexpected Error Occurred",
        description: error.message || "Could not create the client due to an unexpected error.",
        variant: "destructive",
      });
    }
  };

  const toggleClientStatus = async (id: string) => {
    const client = clients.find(c => c.id === id);
    if (!client) return;

    const newStatus = !client.status || client.status === "Inactive";

    try {
      const { error } = await supabase
        .from('app_users')
        .update({ is_active: newStatus })
        .eq('id', id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update client status",
          variant: "destructive",
        });
        return;
      }

      // Refresh clients list
      await fetchClients();

      toast({
        title: "Status updated",
        description: `Client has been ${newStatus ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update client status",
        variant: "destructive",
      });
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke('delete-client', {
        body: { userId: id },
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Client deleted",
        description: "Client has been removed from the system",
      });

      // Refresh clients list
      await fetchClients();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Client Management</h1>
            <p className="text-muted-foreground">Loading clients...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Client Management</h1>
          <p className="text-muted-foreground">Manage your business clients and their settings</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add New Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Business Client</DialogTitle>
              <DialogDescription>
                Create a new business account for Vass.ai voice assistant platform
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  placeholder="Enter business name"
                  value={newClient.businessName}
                  onChange={(e) => setNewClient({ ...newClient, businessName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter username for login"
                  value={newClient.username}
                  onChange={(e) => setNewClient({ ...newClient, username: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter a valid email for login"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={newClient.password}
                  onChange={(e) => setNewClient({ ...newClient, password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="callRate">Call Rate (₹/min)</Label>
                <Input
                  id="callRate"
                  type="number"
                  step="0.1"
                  value={newClient.callRate}
                  onChange={(e) => setNewClient({ ...newClient, callRate: Number(e.target.value) })}
                />
              </div>
            
              <div className="flex items-center space-x-2">
                <Switch
                  id="autoPrint"
                  checked={newClient.autoPrint}
                  onCheckedChange={(checked) => setNewClient({ ...newClient, autoPrint: checked })}
                />
                <Label htmlFor="autoPrint">Enable auto-print by default</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo">Brand Logo</Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setNewClient(prev => ({ ...prev, logo: file }));
                    }
                  }}
                />
              </div>
              <Button onClick={handleAddClient} className="w-full">
                Create Client Account
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Clients ({clients.length})</CardTitle>
          <CardDescription>Manage all registered business accounts</CardDescription>
        </CardHeader>
        <CardContent className="max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Call Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Auto Print</TableHead>
                <TableHead>Total Calls</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.businessName}</TableCell>
                  <TableCell>{client.username}</TableCell>
                  <TableCell>₹{client.callRate}/min</TableCell>
                  <TableCell>
                    <Badge variant={client.status === "Active" ? "default" : "secondary"}>
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={client.autoPrint ? "default" : "outline"}>
                      {client.autoPrint ? "Enabled" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell>{client.totalCalls}</TableCell>
                  <TableCell>₹{client.totalRevenue.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleClientStatus(client.id)}
                      >
                        <RefreshCw className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteClient(client.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {clients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No clients found. Add your first client to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
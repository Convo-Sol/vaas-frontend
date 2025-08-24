import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Settings, Activity, Plus, History } from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { ClientManagement } from "@/components/ClientManagement";
import { AdminOrderHistory } from "@/components/AdminOrderHistory";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState("overview");

  const [stats, setStats] = useState([
    {
      title: "Total Clients",
      value: "0",
      description: "Active business accounts",
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Total Calls Today",
      value: "0",
      description: "Across all clients",
      icon: Activity,
      color: "text-success",
    },
    {
      title: "Revenue Today",
      value: "$0",
      description: "Call charges collected",
      icon: Settings,
      color: "text-primary-glow",
    },
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch total clients
        const { data: clientsData, error: clientsError } = await supabase
          .from('app_users')
          .select('id', { count: 'exact' })
          .eq('user_type', 'business')
          .eq('is_active', true);

        if (clientsError) throw clientsError;

        // Fetch calls today
        const today = new Date().toISOString().split('T')[0];
        const { data: callsData, error: callsError } = await supabase
          .from('orders')
          .select('id', { count: 'exact' })
          .gte('created_at', `${today}T00:00:00`)
          .lte('created_at', `${today}T23:59:59`);

        if (callsError) throw callsError;

        // Fetch revenue today
        const { data: revenueData, error: revenueError } = await supabase
          .from('orders')
          .select('call_duration, app_users!inner(call_rate)')
          .gte('created_at', `${today}T00:00:00`)
          .lte('created_at', `${today}T23:59:59`);

        if (revenueError) throw revenueError;

        // Calculate revenue
        let totalRevenue = 0;
        if (revenueData) {
          revenueData.forEach(order => {
            const duration = order.call_duration || 0;
            // Extract call_rate from the nested structure
            const rate = (order as any)?.app_users?.[0]?.call_rate || 0;
            totalRevenue += duration * rate;
          });
        }

        setStats([
          {
            title: "Total Clients",
            value: clientsData?.length?.toString() || "0",
            description: "Active business accounts",
            icon: Users,
            color: "text-primary",
          },
          {
            title: "Total Calls Today",
            value: callsData?.length?.toString() || "0",
            description: "Across all clients",
            icon: Activity,
            color: "text-success",
          },
          {
            title: "Revenue Today",
            value: `$${Math.round(totalRevenue).toLocaleString()}`,
            description: "Call charges collected",
            icon: Settings,
            color: "text-primary-glow",
          },
        ]);
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, []);

  const [recentClients, setRecentClients] = useState([
    { id: 1, name: "Loading...", status: "Loading", calls: 0, revenue: "$0" },
  ]);

  useEffect(() => {
    const fetchRecentClients = async () => {
      try {
        const { data: clientsData, error: clientsError } = await supabase
          .from('app_users')
          .select(`
            id,
            business_name,
            is_active,
            orders!inner(
              id,
              call_duration,
              call_rate:app_users!inner(call_rate)
            )
          `)
          .eq('user_type', 'business')
          .order('created_at', { ascending: false })
          .limit(5);

        if (clientsError) throw clientsError;

        const formattedClients = clientsData?.map((client, index) => {
          const totalCalls = client.orders?.length || 0;
          const totalRevenue = client.orders?.reduce((sum, order) => {
            const duration = order.call_duration || 0;
            // Extract call_rate from the nested structure
            const rate = (order as any)?.call_rate?.[0]?.call_rate || 0;
            return sum + (duration * rate);
          }, 0) || 0;

          return {
            id: client.id,
            name: client.business_name || 'Unknown',
            status: client.is_active ? 'Active' : 'Inactive',
            calls: totalCalls,
            revenue: `$${Math.round(totalRevenue).toLocaleString()}`,
          };
        }) || [];

        setRecentClients(formattedClients);
      } catch (error) {
        console.error("Error fetching recent clients:", error);
        setRecentClients([
          { id: 1, name: "Error loading data", status: "Error", calls: 0, revenue: "$0" },
        ]);
      }
    };

    fetchRecentClients();
  }, []);

  const renderContent = () => {
    switch (activeSection) {
      case "clients":
        return <ClientManagement />;
      case "orders":
        return <AdminOrderHistory />;
      default:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add New Client
              </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-3">
              {stats.map((stat, index) => (
                <Card key={index} className="shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent Clients */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Client Activity</CardTitle>
                <CardDescription>Latest updates from your business clients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentClients.map((client) => (
                    <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <Badge variant={client.status === "Active" ? "default" : "secondary"}>
                            {client.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{client.calls} calls</p>
                        <p className="text-sm text-muted-foreground">{client.revenue}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      <AdminSidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      <main className="flex-1 p-6 bg-muted/30">
        {renderContent()}
      </main>
    </div>
  );
};

export default AdminDashboard;
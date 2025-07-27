import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Settings, Activity, Plus } from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { ClientManagement } from "@/components/ClientManagement";

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState("overview");

  const stats = [
    {
      title: "Total Clients",
      value: "24",
      description: "Active business accounts",
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Total Calls Today",
      value: "1,247",
      description: "Across all clients",
      icon: Activity,
      color: "text-success",
    },
    {
      title: "Revenue Today",
      value: "₹12,450",
      description: "Call charges collected",
      icon: Settings,
      color: "text-primary-glow",
    },
  ];

  const recentClients = [
    { id: 1, name: "Pizza Palace", status: "Active", calls: 45, revenue: "₹890" },
    { id: 2, name: "Tech Solutions", status: "Active", calls: 23, revenue: "₹460" },
    { id: 3, name: "Fashion Store", status: "Inactive", calls: 0, revenue: "₹0" },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "clients":
        return <ClientManagement />;
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
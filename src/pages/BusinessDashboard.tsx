import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Bell, Phone, Clock, Printer, Settings as SettingsIcon } from "lucide-react";
import { BusinessSidebar } from "@/components/BusinessSidebar";
import { NewOrders } from "@/components/NewOrders";
import { OrderHistory } from "@/components/OrderHistory";
import { CallUsage } from "@/components/CallUsage";
import { PrintSettings } from "@/components/PrintSettings";

const BusinessDashboard = () => {
  const [activeSection, setActiveSection] = useState("orders");
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(true);

  const stats = [
    {
      title: "New Orders Today",
      value: "12",
      description: "Pending orders from voice calls",
      icon: Bell,
      color: "text-primary",
    },
    {
      title: "Total Calls",
      value: "47",
      description: "Voice calls received today",
      icon: Phone,
      color: "text-success",
    },
    {
      title: "Call Minutes",
      value: "127",
      description: "Total minutes used today",
      icon: Clock,
      color: "text-primary-glow",
    },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "orders":
        return <NewOrders />;
      case "history":
        return <OrderHistory />;
      case "usage":
        return <CallUsage />;
      case "settings":
        return <PrintSettings />;
      default:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Business Dashboard</h1>
              <div className="flex items-center space-x-2">
                <Printer className="w-4 h-4" />
                <span className="text-sm">Auto Print</span>
                <Switch
                  checked={autoPrintEnabled}
                  onCheckedChange={setAutoPrintEnabled}
                />
              </div>
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

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your voice assistant settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col"
                    onClick={() => setActiveSection("orders")}
                  >
                    <Bell className="w-6 h-6 mb-2" />
                    View New Orders
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col"
                    onClick={() => setActiveSection("history")}
                  >
                    <Clock className="w-6 h-6 mb-2" />
                    Order History
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col"
                    onClick={() => setActiveSection("usage")}
                  >
                    <Phone className="w-6 h-6 mb-2" />
                    Call Usage
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col"
                    onClick={() => setActiveSection("settings")}
                  >
                    <SettingsIcon className="w-6 h-6 mb-2" />
                    Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      <BusinessSidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      <main className="flex-1 p-6 bg-muted/30">
        {renderContent()}
      </main>
    </div>
  );
};

export default BusinessDashboard;
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Clock, 
  Phone,
  Settings,
  LogOut,
  Home
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BusinessSidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  newOrdersCount?: number;
}

export const BusinessSidebar = ({ activeSection, setActiveSection, newOrdersCount = 0 }: BusinessSidebarProps) => {
  const navigate = useNavigate();
  const businessName = localStorage.getItem("username") || "Business";

  const menuItems = [
    { id: "overview", label: "Overview", icon: Home },
    { 
      id: "orders", 
      label: "New Orders", 
      icon: Bell, 
      badge: newOrdersCount > 0 ? newOrdersCount.toString() : undefined 
    },
    { id: "history", label: "Order History", icon: Clock },
    { id: "usage", label: "Call Usage", icon: Phone },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem("userType");
    localStorage.removeItem("username");
    navigate("/");
  };

  return (
    <div className="w-64 border-r bg-card shadow-sm">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Vass.ai
          </h2>
          <Badge variant="default" className="text-xs">Business</Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1 capitalize">{businessName}</p>
      </div>

      <nav className="px-4 space-y-2">
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant={activeSection === item.id ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveSection(item.id)}
          >
            <item.icon className="w-4 h-4 mr-3" />
            {item.label}
            {item.badge && (
              <Badge variant="destructive" className="ml-auto text-xs">
                {item.badge}
              </Badge>
            )}
          </Button>
        ))}
      </nav>

      <div className="p-4">
        <Button variant="destructive" size="sm" onClick={handleLogout}>
          <LogOut className="w-3 h-3 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
};
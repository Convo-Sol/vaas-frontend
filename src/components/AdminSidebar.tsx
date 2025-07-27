import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Settings, 
  BarChart3, 
  LogOut,
  Home
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AdminSidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export const AdminSidebar = ({ activeSection, setActiveSection }: AdminSidebarProps) => {
  const navigate = useNavigate();

  const menuItems = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "clients", label: "Client Management", icon: Users },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
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
          <Badge variant="destructive" className="text-xs">Admin</Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Admin Control Panel</p>
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
          </Button>
        ))}
      </nav>

      <div className="absolute bottom-6 left-4 right-4">
        <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
          <LogOut className="w-3 h-3 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
};
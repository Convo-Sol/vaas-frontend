import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (userType: "admin" | "business") => {
    if (!credentials.username || !credentials.password) {
      toast({
        title: "Login failed",
        description: "Please enter valid credentials",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Attempting login for:', credentials.username, 'as', userType);
      
      // Query database for user
      const { data: user, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('username', credentials.username)
        .eq('user_type', userType)
        .eq('is_active', true)
        .single();

      console.log('Database query result:', { user, error });

      if (error || !user) {
        console.log('User not found or error:', error);
        toast({
          title: "Login failed",
          description: "Invalid username or password",
          variant: "destructive",
        });
        return;
      }

      // Check password against the stored password in database
      console.log('Comparing passwords:', credentials.password, 'vs', user.password_hash);
      const isValidPassword = user.password_hash === credentials.password;
      
      if (isValidPassword) {
        localStorage.setItem("userType", userType);
        localStorage.setItem("username", credentials.username);
        localStorage.setItem("userId", user.id);
        
        if (userType === "admin") {
          navigate("/admin");
        } else {
          localStorage.setItem("businessName", user.business_name || "");
          navigate("/dashboard");
        }
        
        toast({
          title: "Login successful",
          description: `Welcome to Vass.ai ${userType} panel`,
        });
      } else {
        toast({
          title: "Login failed",
          description: "Invalid username or password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: "An error occurred during login",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary-glow/5">
      <div className="w-full max-w-md p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Vass.ai
          </h1>
          <p className="text-muted-foreground mt-2">Voice Assistant Platform for Businesses</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Access your voice assistant dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="business" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="business">Business</TabsTrigger>
                <TabsTrigger value="admin">Admin</TabsTrigger>
              </TabsList>
              
              <TabsContent value="business" className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="business-username">Username</Label>
                  <Input
                    id="business-username"
                    placeholder="Enter your username"
                    value={credentials.username}
                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-password">Password</Label>
                  <Input
                    id="business-password"
                    type="password"
                    placeholder="Enter your password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => handleLogin("business")}
                >
                  Sign In to Dashboard
                </Button>
              </TabsContent>

              <TabsContent value="admin" className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="admin-username">Admin Username</Label>
                  <Input
                    id="admin-username"
                    placeholder="Enter admin username"
                    value={credentials.username}
                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Admin Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="Enter admin password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  />
                </div>
                <Button 
                  className="w-full bg-destructive hover:bg-destructive/90" 
                  onClick={() => handleLogin("admin")}
                >
                  Sign In to Admin Panel
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
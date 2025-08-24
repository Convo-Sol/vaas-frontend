import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import bcrypt from "bcryptjs";

const Login = () => {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (userType: "admin" | "business") => {
    console.log("Login button clicked for user type:", userType);
    
    if (!credentials.username || !credentials.password) {
      console.log("Missing username or password");
      toast({
        title: "Login failed",
        description: "Please enter a username and password.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Looking up user:", credentials.username, "type:", userType);
      // Step 1: Find user by username to get their email.
      const { data: userProfile, error: profileError } = await supabase
        .from('app_users')
        .select('*')
        .eq('username', credentials.username)
        .eq('user_type', userType)
        .single();

      if (profileError || !userProfile) {
        console.log("User not found or error:", profileError);
        toast({
          title: "Login failed",
          description: "Invalid username or password.",
          variant: "destructive",
        });
        return;
      }

      console.log("User found:", userProfile.username);

      // Step 2: Compare the provided password with the stored password_hash
      console.log("Comparing password with hash...");
      const passwordMatch = await bcrypt.compare(credentials.password, userProfile.password_hash);
      console.log("Password match result:", passwordMatch);
      
      if (!passwordMatch) {
        toast({
          title: "Login failed",
          description: "Invalid username or password.", // Keep error generic for security
          variant: "destructive",
        });
        return;
      }

      // We already have the user profile from step 1.
      // We just need to check their active status and proceed.
      if (userType === "business" && !userProfile.is_active) {
        toast({
          title: "Login failed",
          description: "Your account is inactive. Please contact support.",
          variant: "destructive",
        });
        return;
      }

      localStorage.setItem("userType", userType);
      localStorage.setItem("username", userProfile.username);
      localStorage.setItem("userId", userProfile.id);

      if (userType === "admin") {
        navigate("/admin");
      } else {
        localStorage.setItem("businessName", userProfile.business_name || "");
        navigate("/dashboard");
      }

      toast({
        title: "Login successful",
        description: `Welcome to Vass.ai ${userType} panel`,
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "An error occurred during login.",
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
                    type="text"
                    placeholder="Enter your username"
                    value={credentials.username}
                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="business-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={credentials.password}
                      onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute inset-y-0 right-0 flex items-center justify-center h-full w-10 text-muted-foreground"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
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
                    type="text"
                    placeholder="Enter admin username"
                    value={credentials.username}
                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Admin Password</Label>
                  <div className="relative">
                    <Input
                      id="admin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter admin password"
                      value={credentials.password}
                      onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute inset-y-0 right-0 flex items-center justify-center h-full w-10 text-muted-foreground"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Phone, Users, BarChart3, Printer } from "lucide-react";
import heroImage from "@/assets/hero-dashboard.jpg";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Phone,
      title: "Voice Assistant",
      description: "AI-powered voice calls that handle customer orders naturally"
    },
    {
      icon: Users,
      title: "Client Management",
      description: "Admin panel to manage business clients and their settings"
    },
    {
      icon: BarChart3,
      title: "Usage Analytics",
      description: "Track call usage, charges, and performance metrics"
    },
    {
      icon: Printer,
      title: "Auto Printing",
      description: "Automatic order printing to thermal or standard printers"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary-glow/5">
      {/* Navigation */}
      <nav className="border-b bg-card/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Vass.ai
              </h1>
              <span className="text-sm text-muted-foreground">Voice Assistant Platform</span>
            </div>
            <Button onClick={() => navigate("/login")}>
              Sign In
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-5xl font-bold tracking-tight">
              Voice Assistant Platform
              <span className="block text-4xl bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                for Businesses
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Automate customer order taking with AI-powered voice calls. Manage orders, 
              track usage, and print automatically - all in one powerful dashboard.
            </p>
          </div>

          <div className="flex justify-center space-x-4">
            <Button size="lg" onClick={() => navigate("/login")}>
              Get Started
            </Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>

        {/* Hero Image */}
        <div className="mt-16">
          <img
            src={heroImage}
            alt="Vass.ai Dashboard Preview"
            className="mx-auto rounded-xl shadow-2xl border max-w-5xl w-full"
          />
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Card key={index} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="text-center">
                <div className="w-12 h-12 mx-auto bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <Card className="max-w-2xl mx-auto shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to Transform Your Business?</CardTitle>
              <CardDescription className="text-lg">
                Join businesses already using Vass.ai to automate their order management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="lg" className="w-full sm:w-auto" onClick={() => navigate("/login")}>
                Start Your Free Trial
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;

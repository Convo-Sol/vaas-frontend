import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Printer, Settings, TestTube, Wifi } from "lucide-react";

export const PrintSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    autoPrint: true,
    printerType: "thermal",
    paperSize: "80mm",
    includeTimestamp: true,
    includeCustomerInfo: true,
    includeBusinessLogo: false,
    printCopies: 1,
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your print settings have been updated successfully",
    });
  };

  const handleTestPrint = () => {
    toast({
      title: "Test print sent",
      description: "A test order has been sent to your printer",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Print Settings</h1>
        <p className="text-muted-foreground">Configure your order printing preferences</p>
      </div>

      {/* Auto Print Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Printer className="w-5 h-5 mr-2" />
            Auto Print Configuration
          </CardTitle>
          <CardDescription>Control automatic printing of new orders</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-print">Enable Auto Print</Label>
              <p className="text-sm text-muted-foreground">
                Automatically print new orders as they arrive
              </p>
            </div>
            <Switch
              id="auto-print"
              checked={settings.autoPrint}
              onCheckedChange={(checked) => handleSettingChange("autoPrint", checked)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="printer-type">Printer Type</Label>
              <Select
                value={settings.printerType}
                onValueChange={(value) => handleSettingChange("printerType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select printer type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thermal">Thermal Receipt Printer</SelectItem>
                  <SelectItem value="inkjet">Inkjet Printer</SelectItem>
                  <SelectItem value="laser">Laser Printer</SelectItem>
                  <SelectItem value="dotmatrix">Dot Matrix Printer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paper-size">Paper Size</Label>
              <Select
                value={settings.paperSize}
                onValueChange={(value) => handleSettingChange("paperSize", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select paper size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="80mm">80mm (Thermal)</SelectItem>
                  <SelectItem value="58mm">58mm (Thermal)</SelectItem>
                  <SelectItem value="a4">A4</SelectItem>
                  <SelectItem value="a5">A5</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Print Content Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Print Content Options</CardTitle>
          <CardDescription>Customize what information appears on printed orders</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="timestamp">Include Timestamp</Label>
                <p className="text-sm text-muted-foreground">Show order date and time</p>
              </div>
              <Switch
                id="timestamp"
                checked={settings.includeTimestamp}
                onCheckedChange={(checked) => handleSettingChange("includeTimestamp", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="customer-info">Include Customer Information</Label>
                <p className="text-sm text-muted-foreground">Show customer name and phone</p>
              </div>
              <Switch
                id="customer-info"
                checked={settings.includeCustomerInfo}
                onCheckedChange={(checked) => handleSettingChange("includeCustomerInfo", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="business-logo">Include Business Logo</Label>
                <p className="text-sm text-muted-foreground">Print your business logo header</p>
              </div>
              <Switch
                id="business-logo"
                checked={settings.includeBusinessLogo}
                onCheckedChange={(checked) => handleSettingChange("includeBusinessLogo", checked)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="print-copies">Number of Copies</Label>
            <Select
              value={settings.printCopies.toString()}
              onValueChange={(value) => handleSettingChange("printCopies", parseInt(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select number of copies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Copy</SelectItem>
                <SelectItem value="2">2 Copies</SelectItem>
                <SelectItem value="3">3 Copies</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Printer Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wifi className="w-5 h-5 mr-2" />
            Printer Status
          </CardTitle>
          <CardDescription>Check your printer connection and run tests</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-success rounded-full"></div>
              <div>
                <p className="font-medium">Thermal Printer - Kitchen</p>
                <p className="text-sm text-muted-foreground">Connected via USB</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleTestPrint}>
              <TestTube className="w-4 h-4 mr-2" />
              Test Print
            </Button>
          </div>

          <div className="flex space-x-4">
            <Button onClick={handleSaveSettings} className="flex-1">
              <Settings className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
            <Button variant="outline">
              Configure Printer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
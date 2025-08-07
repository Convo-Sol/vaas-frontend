import { useState, useEffect } from "react";
import ReactDOMServer from "react-dom/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Printer, Settings, TestTube, Wifi, RefreshCw, CheckCircle } from "lucide-react";

const TestPrintContent = () => (
  <div style={{ width: '302px', padding: '10px', fontFamily: 'monospace', fontSize: '12px', color: 'black', background: 'white' }}>
    <h1 style={{ fontSize: '1.2rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '1rem' }}>Test Receipt</h1>
    <p style={{ textAlign: 'center', marginBottom: '1rem' }}>This is a test print from your application.</p>
    <hr style={{ border: 0, borderTop: '1px dashed black', margin: '1rem 0' }} />
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'left' }}>Item</th>
          <th style={{ textAlign: 'right' }}>Qty</th>
          <th style={{ textAlign: 'right' }}>Price</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Sample Item 1</td>
          <td style={{ textAlign: 'right' }}>1</td>
          <td style={{ textAlign: 'right' }}>10.00</td>
        </tr>
      </tbody>
    </table>
    <hr style={{ border: 0, borderTop: '1px dashed black', margin: '1rem 0' }} />
    <p style={{ textAlign: 'center', fontSize: '1rem', fontWeight: '600', marginTop: '1.5rem' }}>Powered by Convo Solutions</p>
    <p style={{ textAlign: 'center', fontSize: '0.75rem', marginTop: '0.5rem' }}>{new Date().toLocaleString()}</p>
  </div>
);

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
    selectedPrinter: "",
  });

  const [printers, setPrinters] = useState<{ id: string; name: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [testPrintStatus, setTestPrintStatus] = useState<'idle' | 'printing' | 'success'>('idle');

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

 const findPrinters = async () => {
  setIsSearching(true);
  toast({ title: "Preparing system print..." });

  // Since browsers cannot list printers, we default to system dialog
  const systemPrinters = [
    { id: "system-default", name: "System Print Dialog" }
  ];

  setTimeout(() => {
    setPrinters(systemPrinters);
    handleSettingChange("selectedPrinter", "system-default");
    setIsSearching(false);
    toast({
      title: "Printer ready",
      description: `System print dialog will be used for printing.`,
    });
  }, 1000);
};

  useEffect(() => {
    findPrinters();
  }, []);

  const handleSaveSettings = () => {
    const selectedPrinterName = printers.find(p => p.id === settings.selectedPrinter)?.name || 'None';
    toast({
      title: "Printer settings saved",
      description: `Default printer has been set to ${selectedPrinterName}.`,
    });
  };

  const handleTestPrint = () => {
    setTestPrintStatus('printing');
    toast({
      title: "Preparing print...",
      description: "Your system's print dialog should appear shortly.",
    });

    const printFrame = document.createElement('iframe');
    printFrame.style.visibility = 'hidden';
    printFrame.style.position = 'absolute';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    
    document.body.appendChild(printFrame);

    const printDocument = printFrame.contentWindow.document;
    const printContent = ReactDOMServer.renderToString(<TestPrintContent />);
    
    printDocument.open();
    printDocument.write(`
      <html>
        <head>
          <title>Print Receipt</title>
          <style>
            @media print {
              @page { size: 80mm auto; margin: 0; }
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printDocument.close();

    printFrame.contentWindow.focus();
    printFrame.contentWindow.print();
    
    document.body.removeChild(printFrame);

    setTestPrintStatus('success');
    setTimeout(() => setTestPrintStatus('idle'), 3000);
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
            Printer Connection
          </CardTitle>
          <CardDescription>Select a printer and run tests</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="printer-select">Select Printer</Label>
            <div className="flex items-center space-x-2">
              <Select
                value={settings.selectedPrinter}
                onValueChange={(value) => handleSettingChange("selectedPrinter", value)}
                disabled={printers.length === 0 || isSearching}
              >
                <SelectTrigger id="printer-select">
                  <SelectValue placeholder="No printers found" />
                </SelectTrigger>
                <SelectContent>
                  {printers.map((printer) => (
                    <SelectItem key={printer.id} value={printer.id}>
                      {printer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={findPrinters} disabled={isSearching}>
                <RefreshCw className={`w-4 h-4 ${isSearching ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          <div className="flex space-x-4 pt-2">
            <Button onClick={handleSaveSettings} className="flex-1">
              <Settings className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
            <Button
              variant="outline"
              onClick={handleTestPrint}
              disabled={!settings.selectedPrinter || testPrintStatus === 'printing' || testPrintStatus === 'success'}
              className="flex-1"
            >
              {testPrintStatus === 'printing' ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Printing...</>
              ) : testPrintStatus === 'success' ? (
                <><CheckCircle className="w-4 h-4 mr-2 text-green-500" /> Print Successful</>
              ) : (
                <><TestTube className="w-4 h-4 mr-2" /> Test Print</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
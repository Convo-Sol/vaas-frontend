import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Filter, Search, RefreshCw, Package, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface HistoryOrder {
  id: string;
  business_name: string;
  caller_number: string;
  caller_name?: string;
  call_duration: number;
  call_status: string;
  call_transcript: string;
  webhook_data: any;
  created_at: string;
  status: "new" | "printed" | "completed";
}

export const OrderHistory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const currentBusinessName = localStorage.getItem("businessName");

  const fetchOrders = async () => {
    if (!currentBusinessName) {
      console.log('No business name found in localStorage');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching order history for business:', currentBusinessName);
      
      const { data, error } = await supabase
        .from('vapi_call')
        .select('*')
        .eq('business_name', currentBusinessName)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching order history:', error);
        toast({
          title: "Error",
          description: "Failed to fetch order history",
          variant: "destructive",
        });
        return;
      }

      console.log('Fetched order history:', data);

      const ordersWithStatus = data?.map(order => ({
        ...order,
        status: "completed" as const, // Default status for history
      })) || [];

      setOrders(ordersWithStatus);
    } catch (error) {
      console.error('Exception fetching order history:', error);
      toast({
        title: "Error",
        description: "Failed to fetch order history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentBusinessName]);

  // Extract order details from webhook_data
  const getOrderDetails = (webhookData: any) => {
    if (!webhookData) return { items: [], total: 0 };
    
    // Try to extract order information from webhook data
    const items = webhookData.items || webhookData.order_items || [];
    const total = webhookData.total || webhookData.order_total || 0;
    
    return { items, total };
  };

  // Extract caller name from webhook data
  const getCallerName = (webhookData: any) => {
    if (!webhookData) return null;
    return webhookData.caller_name || webhookData.customer_name || webhookData.name;
  };

  const filteredOrders = orders.filter(order => {
    const callerName = getCallerName(order.webhook_data);
    return (
      order.caller_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.call_status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      callerName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalCalls = orders.length;
  const completedCalls = orders.filter(order => order.call_status === "completed").length;
  const totalDuration = orders.reduce((sum, order) => sum + (order.call_duration || 0), 0);

  const handleExportCSV = () => {
    const csvContent = [
      ["Order ID", "Caller Number", "Caller Name", "Duration", "Status", "Date", "Business", "Total Amount"],
      ...filteredOrders.map(order => {
        const { total } = getOrderDetails(order.webhook_data);
        const callerName = getCallerName(order.webhook_data);
        return [
          order.id,
          order.caller_number || "N/A",
          callerName || "N/A",
          (order.call_duration || 0).toString(),
          order.call_status || "N/A",
          new Date(order.created_at).toLocaleDateString(),
          order.business_name,
          total.toString(),
        ];
      })
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `order-history-${currentBusinessName}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Order History</h1>
            <p className="text-muted-foreground">Loading order history...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentBusinessName) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Order History</h1>
            <p className="text-muted-foreground">Business not identified. Please log in again.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Order History</h1>
          <p className="text-muted-foreground">View and manage your past orders</p>
          <p className="text-sm text-muted-foreground">
            Business: {currentBusinessName}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchOrders}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCalls}</div>
            <p className="text-xs text-muted-foreground">All time calls</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCalls}</div>
            <p className="text-xs text-muted-foreground">Successfully completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(totalDuration / 60)}m</div>
            <p className="text-xs text-muted-foreground">Total call minutes</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>Filter and search through your order history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by caller number, name, order ID, or status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Caller Number</TableHead>
                <TableHead>Caller Name</TableHead>
                <TableHead>Order Items</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Business</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <p className="text-muted-foreground">No orders found.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const { items, total } = getOrderDetails(order.webhook_data);
                  const callerName = getCallerName(order.webhook_data);
                  
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id.slice(0, 8)}</TableCell>
                      <TableCell>{order.caller_number || "N/A"}</TableCell>
                      <TableCell>{callerName || "N/A"}</TableCell>
                      <TableCell>
                        {items.length > 0 ? (
                          <div className="space-y-1">
                            {items.slice(0, 2).map((item: any, index: number) => (
                              <div key={index} className="text-xs">
                                {item.name || item.item || `Item ${index + 1}`} 
                                <span className="text-muted-foreground ml-1">
                                  (Qty: {item.quantity || 1})
                                </span>
                              </div>
                            ))}
                            {items.length > 2 && (
                              <div className="text-xs text-muted-foreground">
                                +{items.length - 2} more items
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No items</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">₹{total}</TableCell>
                      <TableCell>{order.call_duration || 0}s</TableCell>
                      <TableCell>
                        <Badge variant={order.call_status === "completed" ? "default" : "secondary"}>
                          {order.call_status || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{order.business_name}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
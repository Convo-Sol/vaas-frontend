import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Filter, Search, RefreshCw, User, Package, AlertCircle } from "lucide-react";
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
  created_at: string;
  status: "new" | "printed" | "completed";
  order_details?: {
    items: Array<{
      name: string;
      quantity: number;
      price?: number;
    }>;
    total_quantity?: number;
    total_amount?: number;
  };
}

export const OrderHistory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const { toast } = useToast();
  const currentBusinessName = localStorage.getItem("businessName");

  const fetchOrders = async () => {
    console.log('=== DEBUG: Starting OrderHistory fetchOrders ===');
    console.log('Current business name from localStorage:', currentBusinessName);
    
    if (!currentBusinessName) {
      console.log('No business name found in localStorage');
      setLoading(false);
      setDebugInfo("No business name found in localStorage");
      return;
    }

    try {
      console.log('Fetching order history for business:', currentBusinessName);
      
      // First, let's check what tables exist and what data is available
      const { data: tableInfo, error: tableError } = await supabase
        .from('vapi_call')
        .select('*')
        .limit(1);

      console.log('Table check result:', { tableInfo, tableError });

      // Try to fetch all data first to see what's available
      const { data: allData, error: allDataError } = await supabase
        .from('vapi_call')
        .select('*')
        .limit(10);

      console.log('All data sample:', allData);
      console.log('All data error:', allDataError);

      // Now fetch data for the specific business
      let { data, error } = await supabase
        .from('vapi_call')
        .select('*')
        .eq('business_name', currentBusinessName)
        .order('created_at', { ascending: false });

      console.log('Business-specific query result:', { data, error });
      console.log('Number of orders found:', data?.length || 0);

      if (error) {
        console.error('Error fetching order history:', error);
        setDebugInfo(`Error: ${error.message}`);
        toast({
          title: "Error",
          description: "Failed to fetch order history",
          variant: "destructive",
        });
        return;
      }

      // If no data found, try case-insensitive search
      if (!data || data.length === 0) {
        console.log('No exact match found, trying case-insensitive search...');
        
        const { data: caseInsensitiveData, error: caseError } = await supabase
          .from('vapi_call')
          .select('*')
          .ilike('business_name', currentBusinessName)
          .order('created_at', { ascending: false });

        console.log('Case-insensitive search result:', caseInsensitiveData);
        
        if (caseInsensitiveData && caseInsensitiveData.length > 0) {
          console.log('Found data with case-insensitive search!');
          setDebugInfo(`Found ${caseInsensitiveData.length} orders with case-insensitive search`);
          data = caseInsensitiveData;
        } else {
          // Try searching in orders table as fallback
          console.log('Trying orders table as fallback...');
          const { data: ordersData, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .eq('business_user_id', localStorage.getItem("userId"))
            .order('created_at', { ascending: false });

          console.log('Orders table result:', ordersData);
          
          if (ordersData && ordersData.length > 0) {
            console.log('Found data in orders table!');
            setDebugInfo(`Found ${ordersData.length} orders in orders table`);
            // Convert orders table data to vapi_call format
            data = ordersData.map(order => ({
              ...order,
              business_name: currentBusinessName, // Map business_user_id to business_name
            }));
          } else {
            setDebugInfo(`No orders found for business: ${currentBusinessName}`);
          }
        }
      } else {
        setDebugInfo(`Found ${data.length} orders for business: ${currentBusinessName}`);
      }

      console.log('Final data to process:', data);

      const ordersWithStatus = data?.map(order => {
        console.log('Processing order:', order);
        
        // Parse order details from webhook_data - handle NULL values
        let orderDetails = null;
        if (order.webhook_data) {
          try {
            const webhookData = typeof order.webhook_data === 'string' 
              ? JSON.parse(order.webhook_data) 
              : order.webhook_data;
            
            console.log('Parsed webhook data:', webhookData);
            
            orderDetails = {
              items: webhookData.items || webhookData.order_items || [],
              total_quantity: webhookData.total_quantity || webhookData.quantity || 0,
              total_amount: webhookData.total_amount || webhookData.amount || 0,
            };
          } catch (e) {
            console.log('Could not parse webhook data:', e);
          }
        }

        const processedOrder = {
          ...order,
          status: "completed" as const, // Default status for history
          order_details: orderDetails,
          caller_name: order.webhook_data?.caller_name || order.webhook_data?.customer_name || 'Unknown',
          // Handle NULL values for required fields
          caller_number: order.caller_number || 'Unknown',
          call_duration: order.call_duration || 0,
          call_status: order.call_status || 'unknown',
          call_transcript: order.call_transcript || '',
          business_name: order.business_name || currentBusinessName,
        };

        console.log('Processed order:', processedOrder);
        return processedOrder;
      }) || [];

      console.log('Final orders with status:', ordersWithStatus);
      setOrders(ordersWithStatus);
      
    } catch (error) {
      console.error('Exception fetching order history:', error);
      setDebugInfo(`Exception: ${error.message}`);
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

  const filteredOrders = orders.filter(order =>
    order.caller_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.caller_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.call_status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCalls = orders.length;
  const completedCalls = orders.filter(order => order.call_status === "completed").length;
  const totalDuration = orders.reduce((sum, order) => sum + (order.call_duration || 0), 0);
  const totalRevenue = orders.reduce((sum, order) => {
    return sum + (order.order_details?.total_amount || 0);
  }, 0);

  const handleExportCSV = () => {
    const csvContent = [
      ["Order ID", "Customer Name", "Phone Number", "Items", "Total Quantity", "Total Amount", "Status", "Date", "Business"],
      ...filteredOrders.map(order => [
        order.id.slice(0, 8),
        order.caller_name || "N/A",
        order.caller_number || "N/A",
        order.order_details?.items?.map(item => `${item.name} (${item.quantity})`).join(", ") || "N/A",
        (order.order_details?.total_quantity || 0).toString(),
        (order.order_details?.total_amount || 0).toString(),
        order.call_status || "N/A",
        new Date(order.created_at).toLocaleDateString(),
        order.business_name,
      ])
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
          {debugInfo && (
            <div className="flex items-center mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
              <span className="text-sm text-yellow-800">{debugInfo}</span>
            </div>
          )}
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
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCalls}</div>
            <p className="text-xs text-muted-foreground">All time orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{Math.round(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">From all orders</p>
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
                  placeholder="Search by customer name, phone number, or order ID..."
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
                <TableHead>Customer Name</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Order Items</TableHead>
                <TableHead>Total Qty</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <p className="text-muted-foreground">No orders found.</p>
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-sm text-blue-800">
                        <strong>Debug Info:</strong> Business name: "{currentBusinessName}"
                      </p>
                      <p className="text-sm text-blue-800">
                        Check browser console for detailed debugging information.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id.slice(0, 8)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <User className="w-3 h-3 mr-1" />
                        {order.caller_name || "Unknown"}
                      </div>
                    </TableCell>
                    <TableCell>{order.caller_number || "N/A"}</TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        {order.order_details?.items && order.order_details.items.length > 0 ? (
                          <div className="space-y-1">
                            {order.order_details.items.slice(0, 2).map((item, index) => (
                              <div key={index} className="text-xs">
                                {item.name} (Qty: {item.quantity})
                              </div>
                            ))}
                            {order.order_details.items.length > 2 && (
                              <div className="text-xs text-muted-foreground">
                                +{order.order_details.items.length - 2} more items
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">No items</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Package className="w-3 h-3 mr-1" />
                        {order.order_details?.total_quantity || 0}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      ₹{order.order_details?.total_amount || 0}
                    </TableCell>
                    <TableCell>
                      <Badge variant={order.call_status === "completed" ? "default" : "secondary"}>
                        {order.call_status || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
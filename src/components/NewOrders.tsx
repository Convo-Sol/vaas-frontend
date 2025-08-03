import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Printer, Phone, Clock, User, RefreshCw, Package, Hash, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Order {
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

export const NewOrders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const currentBusinessName = localStorage.getItem("businessName");

  const fetchOrders = async () => {
    console.log('=== DEBUG: Starting fetchOrders ===');
    console.log('Current business name from localStorage:', currentBusinessName);
    console.log('All localStorage items:', Object.keys(localStorage).map(key => ({ key, value: localStorage.getItem(key) })));
    
    if (!currentBusinessName) {
      console.log('No business name found in localStorage');
      setLoading(false);
      setDebugInfo("No business name found in localStorage");
      return;
    }

    try {
      console.log('Fetching orders for business:', currentBusinessName);
      
      // Test Supabase connection first
      console.log('Testing Supabase connection...');
      const { data: testData, error: testError } = await supabase
        .from('app_users')
        .select('count')
        .limit(1);
      
      console.log('Supabase connection test:', { testData, testError });
      
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
        console.error('Error fetching orders:', error);
        setDebugInfo(`Error: ${error.message}`);
        toast({
          title: "Error",
          description: "Failed to fetch orders",
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
            // Try to get all data without filter to see what's available
            console.log('Trying to get all data without filter...');
            const { data: allVapiData, error: allVapiError } = await supabase
              .from('vapi_call')
              .select('*')
              .order('created_at', { ascending: false });

            console.log('All vapi_call data:', allVapiData);
            console.log('All vapi_call error:', allVapiError);

            if (allVapiData && allVapiData.length > 0) {
              console.log('Available business names in database:', [...new Set(allVapiData.map(item => item.business_name))]);
              setDebugInfo(`No orders found for business: ${currentBusinessName}. Available businesses: ${[...new Set(allVapiData.map(item => item.business_name))].join(', ')}`);
            } else {
              setDebugInfo(`No orders found for business: ${currentBusinessName}. No data in vapi_call table.`);
            }
          }
        }
      } else {
        setDebugInfo(`Found ${data.length} orders for business: ${currentBusinessName}`);
      }

      console.log('Final data to process:', data);

      const ordersWithStatus = data?.map(order => {
        console.log('Processing order:', order);
        
        // Parse order details from webhook_data
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
          status: "new" as const,
          order_details: orderDetails,
          caller_name: order.webhook_data?.caller_name || order.webhook_data?.customer_name || 'Unknown',
        };

        console.log('Processed order:', processedOrder);
        return processedOrder;
      }) || [];

      console.log('Final orders with status:', ordersWithStatus);
      setOrders(ordersWithStatus);
      
    } catch (error) {
      console.error('Exception fetching orders:', error);
      setDebugInfo(`Exception: ${error.message}`);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    
    // Set up real-time subscription for new orders
    if (currentBusinessName) {
      const channel = supabase
        .channel('vapi-call-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'vapi_call',
            filter: `business_name=eq.${currentBusinessName}`
          },
          (payload) => {
            console.log('New order received:', payload);
            const newOrder = {
              ...payload.new,
              status: "new" as const,
            } as Order;
            setOrders(prev => [newOrder, ...prev]);
            toast({
              title: "New Order Received!",
              description: `Call from ${newOrder.caller_number}`,
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentBusinessName]);

  const handlePrintOrder = (orderId: string) => {
    setOrders(orders.map(order =>
      order.id === orderId
        ? { ...order, status: "printed" }
        : order
    ));
    
    toast({
      title: "Order sent to printer",
      description: `Order ${orderId} has been printed successfully`,
    });
  };

  const handleMarkCompleted = (orderId: string) => {
    setOrders(orders.map(order =>
      order.id === orderId
        ? { ...order, status: "completed" }
        : order
    ));
    
    toast({
      title: "Order completed",
      description: `Order ${orderId} has been marked as completed`,
    });
  };

  const newOrdersCount = orders.filter(order => order.status === "new").length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">New Orders</h1>
            <p className="text-muted-foreground">Loading orders...</p>
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
            <h1 className="text-3xl font-bold">New Orders</h1>
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
          <h1 className="text-3xl font-bold">New Orders</h1>
          <p className="text-muted-foreground">
            {newOrdersCount} new orders waiting for processing
          </p>
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
        <Button variant="outline" onClick={fetchOrders}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No orders received yet.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Orders will appear here when customers call your business number.
              </p>
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800">
                  <strong>Debug Info:</strong> Business name: "{currentBusinessName}"
                </p>
                <p className="text-sm text-blue-800">
                  Check browser console for detailed debugging information.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <Card key={order.id} className="shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
                    <Badge
                      variant={
                        order.status === "new"
                          ? "destructive"
                          : order.status === "printed"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {order.status === "new" ? "NEW" : order.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(order.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <CardDescription>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      {order.caller_name || 'Unknown Customer'}
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      {order.caller_number}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      Duration: {order.call_duration}s
                    </div>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Order Details */}
                  {order.order_details && order.order_details.items && order.order_details.items.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center">
                        <Package className="w-4 h-4 mr-2" />
                        Order Items:
                      </h4>
                      <div className="bg-muted p-3 rounded-md">
                        {order.order_details.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center py-1">
                            <span className="text-sm">{item.name}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-muted-foreground">
                                Qty: {item.quantity}
                              </span>
                              {item.price && (
                                <span className="text-sm font-medium">
                                  ₹{item.price}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        {order.order_details.total_quantity && (
                          <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">Total Quantity:</span>
                              <span className="font-medium">{order.order_details.total_quantity}</span>
                            </div>
                          </div>
                        )}
                        {order.order_details.total_amount && (
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Total Amount:</span>
                            <span className="font-medium">₹{order.order_details.total_amount}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Call Details */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Call Details:</h4>
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm"><strong>Status:</strong> {order.call_status}</p>
                      {order.call_transcript && (
                        <p className="text-sm mt-2"><strong>Transcript:</strong></p>
                      )}
                      {order.call_transcript && (
                        <p className="text-sm text-muted-foreground italic mt-1">
                          {order.call_transcript}
                        </p>
                      )}
                    </div>
                  </div>
                
                <div className="flex space-x-2 pt-4">
                  {order.status === "new" && (
                    <Button onClick={() => handlePrintOrder(order.id)}>
                      <Printer className="w-4 h-4 mr-2" />
                      Print Order
                    </Button>
                  )}
                  {order.status === "printed" && (
                    <Button 
                      variant="outline" 
                      onClick={() => handleMarkCompleted(order.id)}
                    >
                      Mark Completed
                    </Button>
                  )}
                  {order.status === "completed" && (
                    <Badge variant="secondary">Completed</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
        )}
      </div>
    </div>
  );
};
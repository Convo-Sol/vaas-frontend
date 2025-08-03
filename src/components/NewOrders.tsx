import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Printer, Phone, Clock, User, RefreshCw, Package, Hash } from "lucide-react";
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
}

export const NewOrders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const currentBusinessName = localStorage.getItem("businessName");

  const fetchOrders = async () => {
    if (!currentBusinessName) {
      console.log('No business name found in localStorage');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching orders for business:', currentBusinessName);
      
      const { data, error } = await supabase
        .from('vapi_call')
        .select('*')
        .eq('business_name', currentBusinessName)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        toast({
          title: "Error",
          description: "Failed to fetch orders",
          variant: "destructive",
        });
        return;
      }

      console.log('Fetched orders:', data);

      const ordersWithStatus = data?.map(order => ({
        ...order,
        status: "new" as const, // Default status for new orders
      })) || [];

      setOrders(ordersWithStatus);
    } catch (error) {
      console.error('Exception fetching orders:', error);
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
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => {
            const { items, total } = getOrderDetails(order.webhook_data);
            const callerName = getCallerName(order.webhook_data);
            
            return (
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
                        <Phone className="w-4 h-4 mr-2" />
                        {order.caller_number}
                      </div>
                      {callerName && (
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          {callerName}
                        </div>
                      )}
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
                    {items.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium flex items-center">
                          <Package className="w-4 h-4 mr-2" />
                          Order Details:
                        </h4>
                        <div className="bg-muted p-3 rounded-md">
                          {items.map((item: any, index: number) => (
                            <div key={index} className="flex justify-between items-center py-1">
                              <span className="text-sm">
                                {item.name || item.item || `Item ${index + 1}`}
                              </span>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-muted-foreground">
                                  Qty: {item.quantity || 1}
                                </span>
                                <span className="text-sm font-medium">
                                  ₹{item.price || 0}
                                </span>
                              </div>
                            </div>
                          ))}
                          <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">Total:</span>
                              <span className="font-bold">₹{total}</span>
                            </div>
                          </div>
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
            );
          })
        )}
      </div>
    </div>
  );
};
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Printer, Phone, Clock, User, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Order {
  id: string;
  business_user_id: string;
  caller_number: string;
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
  const currentUserId = localStorage.getItem("userId");

  const fetchOrders = async () => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('business_user_id', currentUserId)
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch orders",
          variant: "destructive",
        });
        return;
      }

      const ordersWithStatus = data?.map(order => ({
        ...order,
        status: "new" as const, // Default status for new orders
      })) || [];

      setOrders(ordersWithStatus);
    } catch (error) {
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
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `business_user_id=eq.${currentUserId}`
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
  }, [currentUserId]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">New Orders</h1>
          <p className="text-muted-foreground">
            {newOrdersCount} new orders waiting for processing
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
          orders.map((order) => (
            <Card key={order.id} className="shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <CardTitle className="text-lg">Call #{order.id.slice(0, 8)}</CardTitle>
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
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      Duration: {order.call_duration}s
                    </div>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
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
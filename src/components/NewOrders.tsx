import { useState, useEffect } from "react";
import ReactDOMServer from "react-dom/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Printer, Phone, Clock, User, RefreshCw, Package, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { OrderPrintContent } from "./OrderPrintContent";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Order {
  id: string;
  business_name: string;
  phone_number: string;
  caller_name: string;
  order: string;
  quantity: number;
  raw_transcript: string;
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
      
      let data = null;
      let error = null;

      // Strategy 1: Exact match
      console.log('Strategy 1: Exact business name match');
      const { data: exactData, error: exactError } = await supabase
        .from('vapi_call')
        .select('*')
        .eq('business_name', currentBusinessName)
        .order('created_at', { ascending: false });

      if (exactData && exactData.length > 0) {
        console.log('Found data with exact match:', exactData.length, 'records');
        data = exactData;
        error = exactError;
      } else {
        console.log('No exact match found, trying case-insensitive search...');
        
        // Strategy 2: Case-insensitive search
        const { data: caseInsensitiveData, error: caseError } = await supabase
          .from('vapi_call')
          .select('*')
          .ilike('business_name', currentBusinessName)
          .order('created_at', { ascending: false });

        if (caseInsensitiveData && caseInsensitiveData.length > 0) {
          console.log('Found data with case-insensitive search:', caseInsensitiveData.length, 'records');
          data = caseInsensitiveData;
          error = caseError;
        } else {
          console.log('No case-insensitive match found, trying partial match...');
          
          // Strategy 3: Partial match
          const { data: partialData, error: partialError } = await supabase
            .from('vapi_call')
            .select('*')
            .ilike('business_name', `%${currentBusinessName}%`)
            .order('created_at', { ascending: false });

          if (partialData && partialData.length > 0) {
            console.log('Found data with partial match:', partialData.length, 'records');
            data = partialData;
            error = partialError;
          } else {
            // Strategy 4: Try orders table as fallback
            console.log('Trying orders table as fallback...');
            const { data: ordersData, error: ordersError } = await supabase
              .from('orders')
              .select('*')
              .eq('business_user_id', localStorage.getItem("userId"))
              .order('created_at', { ascending: false });

            if (ordersData && ordersData.length > 0) {
              console.log('Found data in orders table:', ordersData.length, 'records');
              data = ordersData.map(order => ({
                ...order,
                business_name: currentBusinessName,
              }));
              error = ordersError;
            }
          }
        }
      }

      console.log('Final query result:', { data, error });
      console.log('Number of orders found:', data?.length || 0);

      if (error) {
        console.error('Error fetching orders:', error);
        toast({
          title: "Error",
          description: "Failed to fetch orders",
          variant: "destructive",
        });
        return;
      }

      console.log('Final data to process:', data);

      const ordersWithStatus = data?.map(order => {
        console.log('Processing order:', order);
        
        const processedOrder = {
          ...order,
          status: "new" as const,
          // Handle NULL values for required fields
          phone_number: order.phone_number || 'Unknown',
          caller_name: order.caller_name || 'Unknown',
          order: order.order || 'No order details',
          quantity: order.quantity || 0,
          raw_transcript: order.raw_transcript || '',
          business_name: order.business_name || currentBusinessName || 'Unknown',
        };

        console.log('Processed order:', processedOrder);
        return processedOrder;
      }) || [];

      console.log('Final orders with status:', ordersWithStatus);
      // Show new and printed orders in the New Orders tab
      const activeOrders = ordersWithStatus.filter(order => 
        order.status === "new" || order.status === "printed"
      );
      setOrders(activeOrders);
      
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
              description: `Call from ${newOrder.phone_number}`,
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentBusinessName]);

  const handlePrintOrder = (order: Order) => {
    const printFrame = document.createElement('iframe');
    printFrame.style.visibility = 'hidden';
    printFrame.style.position = 'absolute';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    
    document.body.appendChild(printFrame);

    const printDocument = printFrame.contentWindow.document;
    const printContent = ReactDOMServer.renderToString(<OrderPrintContent order={order} />);
    
    printDocument.open();
    printDocument.write(`
      <html>
        <head>
          <title>Order Receipt - ${order.id.slice(0, 8).toUpperCase()}</title>
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

    // Update order status after printing
    setOrders(orders.map(o =>
      o.id === order.id
        ? { ...o, status: "printed" }
        : o
    ));
    
    toast({
      title: "Order sent to printer",
      description: `Order ${order.id.slice(0, 8)} has been printed successfully`,
    });
  };

  const handleMarkCompleted = async (orderId: string) => {
    try {
      // Update the order status in the database
      const { error } = await supabase
        .from('vapi_call')
        .update({ status: "completed" })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order status:', error);
        toast({
          title: "Error",
          description: "Failed to mark order as completed",
          variant: "destructive",
        });
        return;
      }

      // Remove the order from the local state (it will now appear in Order History)
      setOrders(orders.filter(order => order.id !== orderId));
      
      toast({
        title: "Order completed",
        description: `Order has been marked as completed`,
      });
    } catch (error) {
      console.error('Exception marking order as completed:', error);
      toast({
        title: "Error",
        description: "Failed to mark order as completed",
        variant: "destructive",
      });
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('vapi_call')
        .delete()
        .eq('id', orderId);

      if (error) {
        console.error('Error deleting order:', error);
        toast({
          title: "Error",
          description: "Failed to delete order",
          variant: "destructive",
        });
        return;
      }

      // Remove the order from the local state
      setOrders(orders.filter(order => order.id !== orderId));
      
      toast({
        title: "Order deleted",
        description: "Order has been deleted successfully",
      });
    } catch (error) {
      console.error('Exception deleting order:', error);
      toast({
        title: "Error",
        description: "Failed to delete order",
        variant: "destructive",
      });
    }
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
                Orders will appear here when customers call your business no.
              </p>
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
                      {order.caller_name}
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      {order.phone_number}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      Quantity: {order.quantity}
                    </div>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Order Details */}
                  {order.order && (
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center">
                        <Package className="w-4 h-4 mr-2" />
                        Order Details:
                      </h4>
                      <div className="bg-muted p-3 rounded-md">
                        <p className="text-sm"><strong>Order:</strong> {order.order}</p>
                        <p className="text-sm"><strong>Quantity:</strong> {order.quantity}</p>
                        {/* <p className="text-sm"><strong>Raw Transcript:</strong> {order.raw_transcript}</p> */}
                      </div>
                    </div>
                  )}

                  {/* Call Details */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Call Details:</h4>
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm"><strong>Quantity:</strong> {order.quantity}</p>
                      {/* {order.raw_transcript && (
                        // <p className="text-sm mt-2"><strong>Transcript:</strong></p>
                      )} */}
                      {/* {order.raw_transcript && (
                        <p className="text-sm text-muted-foreground italic mt-1">
                          {order.raw_transcript}
                        </p>
                      )} */}
                    </div>
                  </div>
                
                <div className="flex space-x-2 pt-4">
                {order.status === "new" && (
                  <>
                    <Button onClick={() => handlePrintOrder(order)}>
                      <Printer className="w-4 h-4 mr-2" />
                      Print Order
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => handleDeleteOrder(order.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Order
                    </Button>
                  </>
                )}
                {order.status === "printed" && (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => handleMarkCompleted(order.id)}
                    >
                      Mark Completed
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => handleDeleteOrder(order.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Order
                    </Button>
                  </>
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
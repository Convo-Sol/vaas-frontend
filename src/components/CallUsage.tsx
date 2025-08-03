import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Phone, Clock, TrendingUp, Calendar, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CallData {
  id: string;
  business_name: string;
  caller_number: string;
  call_duration: number;
  call_status: string;
  created_at: string;
}

export const CallUsage = () => {
  const [callData, setCallData] = useState<CallData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const currentBusinessName = localStorage.getItem("businessName");

  const fetchCallData = async () => {
    if (!currentBusinessName) {
      console.log('No business name found in localStorage');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching call usage for business:', currentBusinessName);
      
      const { data, error } = await supabase
        .from('vapi_call')
        .select('*')
        .eq('business_name', currentBusinessName)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching call data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch call usage data",
          variant: "destructive",
        });
        return;
      }

      console.log('Fetched call data:', data);
      setCallData(data || []);
    } catch (error) {
      console.error('Exception fetching call data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch call usage data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCallData();
  }, [currentBusinessName]);

  // Calculate usage statistics
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayCalls = callData.filter(call => 
    new Date(call.created_at) >= today
  );
  
  const todayMinutes = todayCalls.reduce((sum, call) => sum + (call.call_duration || 0), 0);
  const todayCharges = todayMinutes * 2.5; // Assuming ₹2.5 per minute
  
  const monthlyCalls = callData.filter(call => {
    const callDate = new Date(call.created_at);
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return callDate >= firstDayOfMonth;
  });
  
  const monthlyMinutes = monthlyCalls.reduce((sum, call) => sum + (call.call_duration || 0), 0);
  const monthlyCharges = monthlyMinutes * 2.5;
  
  const callRate = 2.5; // ₹2.5 per minute
  const monthlyLimit = 5000; // minutes
  const usagePercentage = (monthlyMinutes / monthlyLimit) * 100;
  const avgCallDuration = todayCalls.length > 0 ? todayMinutes / todayCalls.length : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Call Usage & Charges</h1>
          <p className="text-muted-foreground">Loading usage data...</p>
        </div>
      </div>
    );
  }

  if (!currentBusinessName) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Call Usage & Charges</h1>
          <p className="text-muted-foreground">Business not identified. Please log in again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Call Usage & Charges</h1>
          <p className="text-muted-foreground">Monitor your voice assistant usage and billing</p>
          <p className="text-sm text-muted-foreground">
            Business: {currentBusinessName}
          </p>
        </div>
        <Button variant="outline" onClick={fetchCallData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Today's Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Today's Usage
          </CardTitle>
          <CardDescription>Real-time usage statistics for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Minutes Used</span>
                <Phone className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-bold">{Math.round(todayMinutes / 60)} min</div>
              <p className="text-xs text-muted-foreground">{todayCalls.length} calls received</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Charges Incurred</span>
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
              <div className="text-2xl font-bold">₹{Math.round(todayCharges)}</div>
              <p className="text-xs text-muted-foreground">@ ₹{callRate}/minute</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Avg Call Duration</span>
                <Clock className="w-4 h-4 text-primary-glow" />
              </div>
              <div className="text-2xl font-bold">
                {todayCalls.length > 0 ? (avgCallDuration / 60).toFixed(1) : 0} min
              </div>
              <p className="text-xs text-muted-foreground">Per call average</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Usage Overview</CardTitle>
          <CardDescription>Your usage patterns for this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Monthly Minutes</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(monthlyMinutes / 60)} / {monthlyLimit}
                    </span>
                  </div>
                  <Progress value={usagePercentage} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {usagePercentage.toFixed(1)}% of monthly limit used
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Calls</span>
                    <span className="font-medium">{monthlyCalls.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Minutes</span>
                    <span className="font-medium">{Math.round(monthlyMinutes / 60)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Charges</span>
                    <span className="font-medium">₹{Math.round(monthlyCharges)}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium">Usage Breakdown</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Completed Calls</span>
                    <div className="text-right">
                      <div className="font-medium">
                        {monthlyCalls.filter(call => call.call_status === "completed").length} calls
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {monthlyCalls.length > 0 
                          ? ((monthlyCalls.filter(call => call.call_status === "completed").length / monthlyCalls.length) * 100).toFixed(1)
                          : 0}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Failed Calls</span>
                    <div className="text-right">
                      <div className="font-medium">
                        {monthlyCalls.filter(call => call.call_status !== "completed").length} calls
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {monthlyCalls.length > 0 
                          ? ((monthlyCalls.filter(call => call.call_status !== "completed").length / monthlyCalls.length) * 100).toFixed(1)
                          : 0}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Calls</span>
                    <div className="text-right">
                      <div className="font-medium">{monthlyCalls.length} calls</div>
                      <div className="text-xs text-muted-foreground">100%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Information */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Information</CardTitle>
          <CardDescription>Current rates and billing details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="font-medium">Current Plan</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Call Rate</span>
                  <span className="font-medium">₹{callRate}/minute</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Monthly Limit</span>
                  <span className="font-medium">{monthlyLimit} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Billing Cycle</span>
                  <span className="font-medium">Monthly</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Next Bill Estimate</h4>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">₹{Math.round(monthlyCharges)}</div>
                <p className="text-sm text-muted-foreground">
                  Based on current usage pattern
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
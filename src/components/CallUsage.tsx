import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Phone, Clock, TrendingUp, Calendar } from "lucide-react";

export const CallUsage = () => {
  const usageData = {
    todayMinutes: 127,
    todayCalls: 47,
    todayCharges: 317.5,
    monthlyMinutes: 2340,
    monthlyCalls: 832,
    monthlyCharges: 5850,
    callRate: 2.5,
    monthlyLimit: 5000, // minutes
  };

  const usagePercentage = (usageData.monthlyMinutes / usageData.monthlyLimit) * 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Call Usage & Charges</h1>
        <p className="text-muted-foreground">Monitor your voice assistant usage and billing</p>
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
              <div className="text-2xl font-bold">{usageData.todayMinutes} min</div>
              <p className="text-xs text-muted-foreground">{usageData.todayCalls} calls received</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Charges Incurred</span>
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
              <div className="text-2xl font-bold">₹{usageData.todayCharges}</div>
              <p className="text-xs text-muted-foreground">@ ₹{usageData.callRate}/minute</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Avg Call Duration</span>
                <Clock className="w-4 h-4 text-primary-glow" />
              </div>
              <div className="text-2xl font-bold">
                {(usageData.todayMinutes / usageData.todayCalls).toFixed(1)} min
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
                      {usageData.monthlyMinutes} / {usageData.monthlyLimit}
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
                    <span className="font-medium">{usageData.monthlyCalls}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Minutes</span>
                    <span className="font-medium">{usageData.monthlyMinutes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Charges</span>
                    <span className="font-medium">₹{usageData.monthlyCharges}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium">Usage Breakdown</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Order Calls</span>
                    <div className="text-right">
                      <div className="font-medium">745 calls</div>
                      <div className="text-xs text-muted-foreground">89.5%</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Inquiry Calls</span>
                    <div className="text-right">
                      <div className="font-medium">67 calls</div>
                      <div className="text-xs text-muted-foreground">8.1%</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Support Calls</span>
                    <div className="text-right">
                      <div className="font-medium">20 calls</div>
                      <div className="text-xs text-muted-foreground">2.4%</div>
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
                  <span className="font-medium">₹{usageData.callRate}/minute</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Monthly Limit</span>
                  <span className="font-medium">{usageData.monthlyLimit} minutes</span>
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
                <div className="text-2xl font-bold">₹{usageData.monthlyCharges}</div>
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
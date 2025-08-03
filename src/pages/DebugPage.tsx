import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const DebugPage = () => {
  const [debugResults, setDebugResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const runDebugTests = async () => {
    setLoading(true);
    const results: any = {};

    try {
      // Test 1: Check localStorage
      console.log('=== Test 1: localStorage ===');
      const localStorageData = {
        businessName: localStorage.getItem("businessName"),
        username: localStorage.getItem("username"),
        userId: localStorage.getItem("userId"),
        userType: localStorage.getItem("userType"),
        allKeys: Object.keys(localStorage)
      };
      results.localStorage = localStorageData;
      console.log('localStorage data:', localStorageData);

      // Test 2: Test Supabase connection
      console.log('=== Test 2: Supabase Connection ===');
      const { data: connectionTest, error: connectionError } = await supabase
        .from('app_users')
        .select('count')
        .limit(1);
      results.connection = { data: connectionTest, error: connectionError };
      console.log('Connection test:', { data: connectionTest, error: connectionError });

      // Test 3: Check app_users table
      console.log('=== Test 3: app_users table ===');
      const { data: usersData, error: usersError } = await supabase
        .from('app_users')
        .select('*')
        .eq('user_type', 'business');
      results.users = { data: usersData, error: usersError };
      console.log('Users data:', { data: usersData, error: usersError });

      // Test 4: Check vapi_call table
      console.log('=== Test 4: vapi_call table ===');
      const { data: vapiData, error: vapiError } = await supabase
        .from('vapi_call')
        .select('*')
        .limit(5);
      results.vapiCall = { data: vapiData, error: vapiError };
      console.log('vapi_call data:', { data: vapiData, error: vapiError });

      // Test 5: Check orders table
      console.log('=== Test 5: orders table ===');
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .limit(5);
      results.orders = { data: ordersData, error: ordersError };
      console.log('orders data:', { data: ordersData, error: ordersError });

      // Test 6: Try to fetch data for current business
      console.log('=== Test 6: Business-specific query ===');
      const businessName = localStorage.getItem("businessName");
      if (businessName) {
        const { data: businessData, error: businessError } = await supabase
          .from('vapi_call')
          .select('*')
          .eq('business_name', businessName);
        results.businessQuery = { data: businessData, error: businessError, businessName };
        console.log('Business query:', { data: businessData, error: businessError, businessName });
      }

      setDebugResults(results);
    } catch (error) {
      console.error('Debug test error:', error);
      results.error = error;
      setDebugResults(results);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Database Debug Page</h1>
        <p className="text-muted-foreground">Run tests to debug database connection and data issues</p>
      </div>

      <Button onClick={runDebugTests} disabled={loading}>
        {loading ? "Running Tests..." : "Run Debug Tests"}
      </Button>

      {Object.keys(debugResults).length > 0 && (
        <div className="space-y-4">
          {Object.entries(debugResults).map(([key, value]) => (
            <Card key={key}>
              <CardHeader>
                <CardTitle className="text-lg">{key}</CardTitle>
                <CardDescription>Debug information for {key}</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(value, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}; 
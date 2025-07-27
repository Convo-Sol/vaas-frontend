-- Add webhook_url column to app_users table
ALTER TABLE public.app_users 
ADD COLUMN webhook_url TEXT;

-- Create orders table to store incoming webhook data
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  caller_number TEXT,
  call_duration INTEGER,
  call_status TEXT,
  call_transcript TEXT,
  webhook_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policies for orders table
CREATE POLICY "Business users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (business_user_id = auth.uid());

CREATE POLICY "Admin can view all orders" 
ON public.orders 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.app_users 
  WHERE id = auth.uid() AND user_type = 'admin'
));

-- Create trigger for orders updated_at
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
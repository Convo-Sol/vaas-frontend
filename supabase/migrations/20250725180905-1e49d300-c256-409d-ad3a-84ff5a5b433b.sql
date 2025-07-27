-- Create enum for user types
CREATE TYPE public.user_type AS ENUM ('admin', 'business');

-- Create users table for application users
CREATE TABLE public.app_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  user_type user_type NOT NULL,
  business_name TEXT,
  call_rate DECIMAL(10,2) DEFAULT 0,
  auto_print BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- Create policies for app_users
CREATE POLICY "Admin can view all users" 
ON public.app_users 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.app_users au 
  WHERE au.id = auth.uid()::uuid 
  AND au.user_type = 'admin'
));

CREATE POLICY "Users can view their own record" 
ON public.app_users 
FOR SELECT 
USING (id = auth.uid()::uuid);

CREATE POLICY "Admin can insert users" 
ON public.app_users 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.app_users au 
  WHERE au.id = auth.uid()::uuid 
  AND au.user_type = 'admin'
));

CREATE POLICY "Admin can update users" 
ON public.app_users 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.app_users au 
  WHERE au.id = auth.uid()::uuid 
  AND au.user_type = 'admin'
));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_app_users_updated_at
BEFORE UPDATE ON public.app_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default admin user (password: admin123)
INSERT INTO public.app_users (username, password_hash, user_type, business_name) 
VALUES ('admin', '$2b$10$rOhDsB8D3zF.y0RkG1lP.eX8vFXLBxC4rQJ5K9l8.7mN3oP2qR4sS', 'admin', 'Vass.ai Admin');
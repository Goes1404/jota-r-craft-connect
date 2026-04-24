-- Migration: Performance optimization for order cleanup
-- Adding index to speed up filtering of pending orders by creation date

CREATE INDEX IF NOT EXISTS idx_orders_status_created_at 
ON public.orders (status, created_at) 
WHERE status = 'Aguardando Pagamento';

-- Optional: Add a column to track when it was cancelled by the system
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;

-- Update the cancel function to also set cancelled_at (Optional but good for reports)
COMMENT ON COLUMN public.orders.cancelled_at IS 'Timestamp when the order was cancelled due to non-payment or manual action.';

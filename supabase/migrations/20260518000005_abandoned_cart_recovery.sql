-- Add recovery email tracking to abandoned_carts
ALTER TABLE public.abandoned_carts
  ADD COLUMN IF NOT EXISTS recovery_email_sent_at TIMESTAMP WITH TIME ZONE;

-- Schedule abandoned cart recovery emails every 5 minutes
-- Requires pg_cron (already enabled in cron_cancel_expired_orders migration)
SELECT cron.schedule(
  'abandoned-cart-recovery',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/send-abandoned-cart-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

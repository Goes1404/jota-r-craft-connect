-- Enable pg_cron extension (requires Supabase Pro or enabling via dashboard)
-- Dashboard → Database → Extensions → pg_cron → Enable
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule cancel-expired-orders to run every 30 minutes
-- This calls the Supabase Edge Function via HTTP
SELECT cron.schedule(
  'cancel-expired-orders',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/cancel-expired-orders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Enable required extensions for cron and HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
--shuni korish esdan chiqmain husan
-- Schedule cleanup job to run every hour (backend endpoint)
SELECT cron.schedule(
  'cleanup-expired-listings',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'http://localhost:3001/api/cleanup-expired',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the status snapshot job to run every 15 minutes
SELECT cron.schedule(
  'status-snapshot-job',
  '*/15 * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://tfkmdbuffehsgmoznhae.supabase.co/functions/v1/status-snapshot',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRma21kYnVmZmVoc2dtb3puaGFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNTMwMDUsImV4cCI6MjA3NjYyOTAwNX0.IfwDhRRnbth4sjNqedsBNEt8tu9Ppnxo0vowIkKzkbQ"}'::jsonb,
        body:=concat('{"timestamp": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

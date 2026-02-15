
-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Store bunq API connection state (installation, session, keys)
CREATE TABLE public.bunq_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  private_key_pem text NOT NULL,
  public_key_pem text NOT NULL,
  installation_token text,
  server_public_key text,
  device_server_id bigint,
  session_token text,
  session_user_id bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(household_id)
);

ALTER TABLE public.bunq_connections ENABLE ROW LEVEL SECURITY;

-- Members can view their own bunq connection
CREATE POLICY "Members can view bunq_connections"
ON public.bunq_connections FOR SELECT
USING (is_household_member(household_id));

-- Members can manage their own bunq connection
CREATE POLICY "Members can insert bunq_connections"
ON public.bunq_connections FOR INSERT
WITH CHECK (is_household_member(household_id));

CREATE POLICY "Members can update bunq_connections"
ON public.bunq_connections FOR UPDATE
USING (is_household_member(household_id));

CREATE POLICY "Members can delete bunq_connections"
ON public.bunq_connections FOR DELETE
USING (is_household_member(household_id));

-- Map bunq monetary accounts to local accounts
CREATE TABLE public.bunq_account_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bunq_connection_id uuid NOT NULL REFERENCES public.bunq_connections(id) ON DELETE CASCADE,
  bunq_monetary_account_id bigint NOT NULL,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  last_payment_id bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(bunq_connection_id, bunq_monetary_account_id)
);

ALTER TABLE public.bunq_account_mappings ENABLE ROW LEVEL SECURITY;

-- Access via parent bunq_connection
CREATE POLICY "Members can view bunq_account_mappings"
ON public.bunq_account_mappings FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.bunq_connections bc
  WHERE bc.id = bunq_account_mappings.bunq_connection_id
  AND is_household_member(bc.household_id)
));

CREATE POLICY "Members can insert bunq_account_mappings"
ON public.bunq_account_mappings FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.bunq_connections bc
  WHERE bc.id = bunq_account_mappings.bunq_connection_id
  AND is_household_member(bc.household_id)
));

CREATE POLICY "Members can update bunq_account_mappings"
ON public.bunq_account_mappings FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.bunq_connections bc
  WHERE bc.id = bunq_account_mappings.bunq_connection_id
  AND is_household_member(bc.household_id)
));

CREATE POLICY "Members can delete bunq_account_mappings"
ON public.bunq_account_mappings FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.bunq_connections bc
  WHERE bc.id = bunq_account_mappings.bunq_connection_id
  AND is_household_member(bc.household_id)
));

-- Trigger for updated_at on bunq_connections
CREATE TRIGGER update_bunq_connections_updated_at
BEFORE UPDATE ON public.bunq_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

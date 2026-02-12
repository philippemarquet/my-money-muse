
-- Households table for shared access between partners
CREATE TABLE public.households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Ons Huishouden',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES public.households(id) ON DELETE SET NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Function to get household_id for current user
CREATE OR REPLACE FUNCTION public.get_household_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT household_id FROM public.profiles WHERE user_id = auth.uid()
$$;

-- Accounts (rekeningen)
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  naam TEXT NOT NULL,
  rekeningnummer TEXT NOT NULL,
  alias TEXT,
  saldo NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  naam TEXT NOT NULL,
  kleur TEXT NOT NULL DEFAULT 'hsl(28, 40%, 48%)',
  icoon TEXT NOT NULL DEFAULT 'ShoppingCart',
  type TEXT NOT NULL DEFAULT 'uitgaven' CHECK (type IN ('inkomsten', 'uitgaven')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Subcategories
CREATE TABLE public.subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  naam TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

-- Transactions
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL,
  datum DATE NOT NULL DEFAULT CURRENT_DATE,
  omschrijving TEXT NOT NULL,
  bedrag NUMERIC(12,2) NOT NULL,
  iban_tegenrekening TEXT,
  alias_tegenrekening TEXT,
  notitie TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Budgets
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  naam TEXT NOT NULL,
  bedrag NUMERIC(12,2) NOT NULL,
  type TEXT NOT NULL DEFAULT 'maandelijks' CHECK (type IN ('maandelijks', 'jaarlijks')),
  richting TEXT NOT NULL DEFAULT 'uitgaven' CHECK (richting IN ('inkomsten', 'uitgaven')),
  rollover BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Budget <-> Category mapping
CREATE TABLE public.budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  UNIQUE(budget_id, category_id)
);
ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies: all based on household membership

-- Households: members can see their own
CREATE POLICY "Users can view own household" ON public.households
  FOR SELECT USING (id = public.get_household_id());

-- Profiles
CREATE POLICY "Users can view household profiles" ON public.profiles
  FOR SELECT USING (household_id = public.get_household_id());
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Accounts
CREATE POLICY "Household members can view accounts" ON public.accounts
  FOR SELECT USING (household_id = public.get_household_id());
CREATE POLICY "Household members can insert accounts" ON public.accounts
  FOR INSERT WITH CHECK (household_id = public.get_household_id());
CREATE POLICY "Household members can update accounts" ON public.accounts
  FOR UPDATE USING (household_id = public.get_household_id());
CREATE POLICY "Household members can delete accounts" ON public.accounts
  FOR DELETE USING (household_id = public.get_household_id());

-- Categories
CREATE POLICY "Household members can view categories" ON public.categories
  FOR SELECT USING (household_id = public.get_household_id());
CREATE POLICY "Household members can insert categories" ON public.categories
  FOR INSERT WITH CHECK (household_id = public.get_household_id());
CREATE POLICY "Household members can update categories" ON public.categories
  FOR UPDATE USING (household_id = public.get_household_id());
CREATE POLICY "Household members can delete categories" ON public.categories
  FOR DELETE USING (household_id = public.get_household_id());

-- Subcategories (via category's household)
CREATE POLICY "Household members can view subcategories" ON public.subcategories
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.categories c WHERE c.id = category_id AND c.household_id = public.get_household_id())
  );
CREATE POLICY "Household members can insert subcategories" ON public.subcategories
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.categories c WHERE c.id = category_id AND c.household_id = public.get_household_id())
  );
CREATE POLICY "Household members can update subcategories" ON public.subcategories
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.categories c WHERE c.id = category_id AND c.household_id = public.get_household_id())
  );
CREATE POLICY "Household members can delete subcategories" ON public.subcategories
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.categories c WHERE c.id = category_id AND c.household_id = public.get_household_id())
  );

-- Transactions
CREATE POLICY "Household members can view transactions" ON public.transactions
  FOR SELECT USING (household_id = public.get_household_id());
CREATE POLICY "Household members can insert transactions" ON public.transactions
  FOR INSERT WITH CHECK (household_id = public.get_household_id());
CREATE POLICY "Household members can update transactions" ON public.transactions
  FOR UPDATE USING (household_id = public.get_household_id());
CREATE POLICY "Household members can delete transactions" ON public.transactions
  FOR DELETE USING (household_id = public.get_household_id());

-- Budgets
CREATE POLICY "Household members can view budgets" ON public.budgets
  FOR SELECT USING (household_id = public.get_household_id());
CREATE POLICY "Household members can insert budgets" ON public.budgets
  FOR INSERT WITH CHECK (household_id = public.get_household_id());
CREATE POLICY "Household members can update budgets" ON public.budgets
  FOR UPDATE USING (household_id = public.get_household_id());
CREATE POLICY "Household members can delete budgets" ON public.budgets
  FOR DELETE USING (household_id = public.get_household_id());

-- Budget categories (via budget's household)
CREATE POLICY "Household members can view budget_categories" ON public.budget_categories
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.budgets b WHERE b.id = budget_id AND b.household_id = public.get_household_id())
  );
CREATE POLICY "Household members can insert budget_categories" ON public.budget_categories
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.budgets b WHERE b.id = budget_id AND b.household_id = public.get_household_id())
  );
CREATE POLICY "Household members can delete budget_categories" ON public.budget_categories
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.budgets b WHERE b.id = budget_id AND b.household_id = public.get_household_id())
  );

-- Trigger for auto-creating profile + household on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_household_id UUID;
BEGIN
  INSERT INTO public.households (name) VALUES ('Mijn Huishouden') RETURNING id INTO new_household_id;
  INSERT INTO public.profiles (user_id, household_id, display_name)
    VALUES (NEW.id, new_household_id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

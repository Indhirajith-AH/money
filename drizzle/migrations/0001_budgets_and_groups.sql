CREATE TABLE public.category_budgets (
  user_id uuid NOT NULL,
  category text NOT NULL,
  cap numeric NOT NULL CHECK (cap > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, category)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.category_budgets TO authenticated;
GRANT ALL ON public.category_budgets TO service_role;
ALTER TABLE public.category_budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own budgets all" ON public.category_budgets FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.split_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  members text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.split_groups TO authenticated;
GRANT ALL ON public.split_groups TO service_role;
ALTER TABLE public.split_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own groups all" ON public.split_groups FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.split_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.split_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  kind text NOT NULL DEFAULT 'expense' CHECK (kind IN ('expense','settle')),
  description text NOT NULL DEFAULT '',
  amount numeric NOT NULL CHECK (amount > 0),
  paid_by text NOT NULL,
  split_among text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.split_entries TO authenticated;
GRANT ALL ON public.split_entries TO service_role;
ALTER TABLE public.split_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own entries all" ON public.split_entries FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX split_entries_group_idx ON public.split_entries(group_id);
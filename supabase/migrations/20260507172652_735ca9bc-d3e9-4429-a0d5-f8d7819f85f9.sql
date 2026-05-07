
-- Companies
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  ticker text,
  sector text,
  industry text,
  created_at timestamptz not null default now()
);

-- Financial reports (raw input)
create table public.financial_reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid,
  year integer not null,
  quarter integer,
  source text not null default 'manual',
  revenue numeric,
  cost_of_goods_sold numeric,
  gross_profit numeric,
  operating_expense numeric,
  net_income numeric,
  total_assets numeric,
  total_liabilities numeric,
  total_equity numeric,
  current_assets numeric,
  current_liabilities numeric,
  inventory numeric,
  operating_cash_flow numeric,
  investing_cash_flow numeric,
  financing_cash_flow numeric,
  raw_json jsonb,
  created_at timestamptz not null default now()
);
create index on public.financial_reports(company_id);

-- Ratios
create table public.financial_ratios (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.financial_reports(id) on delete cascade,
  roe numeric,
  roa numeric,
  net_profit_margin numeric,
  gross_profit_margin numeric,
  current_ratio numeric,
  quick_ratio numeric,
  debt_to_equity numeric,
  debt_ratio numeric,
  revenue_growth numeric,
  created_at timestamptz not null default now()
);
create index on public.financial_ratios(report_id);

-- AI analyses
create table public.ai_analyses (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.financial_reports(id) on delete cascade,
  summary text,
  strengths jsonb default '[]'::jsonb,
  weaknesses jsonb default '[]'::jsonb,
  risks jsonb default '[]'::jsonb,
  recommended_actions jsonb default '[]'::jsonb,
  rating numeric,
  recommendation text,
  rule_score integer,
  rule_verdict text,
  rule_flags jsonb default '[]'::jsonb,
  raw_ai_response text,
  model_used text,
  created_at timestamptz not null default now()
);
create index on public.ai_analyses(report_id);

-- Watchlist
create table public.watchlist (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid,
  added_at timestamptz not null default now(),
  unique (company_id, user_id)
);

-- Chat history
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid,
  role text not null,
  content text not null,
  created_at timestamptz not null default now()
);
create index on public.chat_messages(company_id, created_at);

-- Enable RLS, permissive for public-demo phase
alter table public.companies enable row level security;
alter table public.financial_reports enable row level security;
alter table public.financial_ratios enable row level security;
alter table public.ai_analyses enable row level security;
alter table public.watchlist enable row level security;
alter table public.chat_messages enable row level security;

create policy "public read companies" on public.companies for select using (true);
create policy "public write companies" on public.companies for insert with check (true);
create policy "public update companies" on public.companies for update using (true);

create policy "public read reports" on public.financial_reports for select using (true);
create policy "public write reports" on public.financial_reports for insert with check (true);

create policy "public read ratios" on public.financial_ratios for select using (true);
create policy "public write ratios" on public.financial_ratios for insert with check (true);

create policy "public read analyses" on public.ai_analyses for select using (true);
create policy "public write analyses" on public.ai_analyses for insert with check (true);

create policy "public read watchlist" on public.watchlist for select using (true);
create policy "public write watchlist" on public.watchlist for insert with check (true);
create policy "public delete watchlist" on public.watchlist for delete using (true);

create policy "public read chat" on public.chat_messages for select using (true);
create policy "public write chat" on public.chat_messages for insert with check (true);

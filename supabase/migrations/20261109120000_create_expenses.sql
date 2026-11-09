-- Expenses table (ARCHITECTURE 2.3). Amounts are stored in whole agorot.
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  category text not null
    check (category in ('מזון', 'דלק', 'פנאי', 'רשויות', 'בריאות', 'קניות', 'תחבורה', 'דיור', 'חינוך', 'אחר', 'הכשרה')),
  description text,
  amount_agorot integer not null
    check (amount_agorot between 1 and 10000000),
  expense_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint expenses_description_required_for_other
    check (category <> 'אחר' or (description is not null and length(btrim(description)) > 0))
);

create index expenses_expense_date_idx on public.expenses (expense_date desc, created_at desc);

-- Keep updated_at current on every update
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger expenses_set_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();

-- Access: only the restricted backend user (app_backend) may use the table.
-- app_backend is created manually in each Supabase project (see ARCHITECTURE.md),
-- so its password is never stored in Git. The Data API is disabled, and public
-- roles get no privileges.
alter table public.expenses enable row level security;
revoke all on table public.expenses from anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

grant usage on schema public to app_backend;
grant select, insert, update, delete on table public.expenses to app_backend;

create policy expenses_app_backend_all
  on public.expenses
  for all
  to app_backend
  using (true)
  with check (true);

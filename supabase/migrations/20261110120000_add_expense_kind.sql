-- Record type (PRD 4.4, ARCHITECTURE 2.3): expense / refund / income.
-- Backward compatible: existing rows and clients that do not send a kind
-- get 'expense'; no row is changed otherwise or deleted.
alter table public.expenses
  add column kind text not null default 'expense'
    constraint expenses_kind_check check (kind in ('expense', 'refund', 'income'));

-- Income has no category; expense and refund must have one.
alter table public.expenses
  alter column category drop not null;

alter table public.expenses
  add constraint expenses_category_matches_kind
    check ((kind = 'income') = (category is null));

-- Rollback (only while no income rows exist):
--   alter table public.expenses drop constraint expenses_category_matches_kind;
--   alter table public.expenses alter column category set not null;
--   alter table public.expenses drop column kind;

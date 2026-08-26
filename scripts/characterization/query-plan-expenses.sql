-- Local-test-only. Dashboard's default six-month expense range should use the
-- existing family/month index rather than a full scan.
explain (analyze, buffers)
select month_key, amount, currency, main_category
from public.expense_entries
where family_id = '20000000-0000-4000-8000-000000000001'::uuid
  and month_key >= (date_trunc('month', current_date) - interval '5 months')::date
  and month_key < (date_trunc('month', current_date) + interval '1 month')::date;

-- Local-test-only. The current Revision embed should index one row instead of
-- reading the Household's entire revision history.
explain (analyze, buffers)
select plan.id, plan.month_key, revision.id, revision.version_number
from public.monthly_plans as plan
left join public.monthly_plan_versions as revision
  on revision.id = plan.current_version_id
  and revision.monthly_plan_id = plan.id
where plan.family_id = '20000000-0000-4000-8000-000000000001'::uuid
  and plan.month_key = date_trunc('month', current_date)::date;

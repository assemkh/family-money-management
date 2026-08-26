-- Local-test-only control query. This is the removed shape and should demonstrate
-- that it reads all 242 Revisions in the scaled fixture.
explain (analyze, buffers)
select id, version_number
from public.monthly_plan_versions
where family_id = '20000000-0000-4000-8000-000000000001'::uuid;

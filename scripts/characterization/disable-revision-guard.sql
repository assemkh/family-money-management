-- Local-test-only. Paired with enable-revision-guard.sql by
-- scripts/run-characterization.mjs, which always restores the trigger.
alter table public.monthly_plan_versions disable trigger monthly_plan_versions_immutable;

-- Restores the append-only guard on Monthly Plan Revisions after fixture teardown.
alter table public.monthly_plan_versions enable trigger monthly_plan_versions_immutable;

-- Removes the Phase 2.B characterization Household. Local-test-only: it targets one
-- reserved household name and nothing else, so an interrupted run cannot leave
-- fixtures behind and cannot touch the Phase 1.A performance fixture.
--
-- The caller must disable `monthly_plan_versions_immutable` around this block and
-- restore it afterwards; see scripts/run-characterization.mjs. Monthly Plan Revisions
-- are append-only by design and the trigger fires on the cascade too, so a fixture
-- teardown cannot remove them while it is active. The rule itself is unchanged and
-- stays covered by supabase/tests/004_monthly_plan_versions.test.sql.
do $$
declare
  family_ids uuid[];
  user_ids uuid[];
  remaining_tables text[];
  previous_count integer;
  target_table text;
begin
  select array_agg(id) into family_ids
  from public.families
  where name = 'Phase 2B Characterization Household';

  if family_ids is null then
    return;
  end if;

  select array_agg(id) into user_ids
  from public.profiles
  where family_id = any(family_ids);

  -- Break the self-references that would otherwise block a straight delete.
  update public.monthly_plans set current_version_id = null where family_id = any(family_ids);
  update public.expense_categories set parent_category_id = null where family_id = any(family_ids);



  select array_agg(table_name order by table_name) into remaining_tables
  from (
    select distinct table_name
    from information_schema.columns
    where table_schema = 'public'
      and column_name = 'family_id'
      and table_name not in ('families', 'profiles')
  ) as family_tables;

  -- Derive a safe deletion order from the live schema instead of hard-coding one.
  while coalesce(array_length(remaining_tables, 1), 0) > 0 loop
    previous_count := array_length(remaining_tables, 1);
    foreach target_table in array remaining_tables loop
      begin
        execute format('delete from public.%I where family_id = any($1)', target_table)
          using family_ids;
        remaining_tables := array_remove(remaining_tables, target_table);
      exception
        when foreign_key_violation then
          null;
      end;
    end loop;

    if array_length(remaining_tables, 1) = previous_count then
      raise exception 'Could not safely order characterization cleanup: %', remaining_tables;
    end if;
  end loop;

  delete from public.profiles where id = any(user_ids);
  delete from public.families where id = any(family_ids);
  delete from auth.users where id = any(user_ids);

end;
$$;

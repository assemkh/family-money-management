do $$
declare
  family_ids uuid[];
  previous_count integer;
  remaining_tables text[];
  target_table text;
  user_ids uuid[];
begin
  -- This block is local-test-only. It targets the reserved Phase 1.A family
  -- prefix so interrupted test runs cannot leave Auth/profile fixtures behind.
  -- Never run it on a linked project.
  select array_agg(id) into family_ids
  from public.families
  where name like 'Phase 1A % Household%';

  if family_ids is null then
    return;
  end if;

  select array_agg(id) into user_ids
  from public.profiles
  where family_id = any(family_ids);

  select array_agg(table_name order by table_name) into remaining_tables
  from (
    select distinct table_name
    from information_schema.columns
    where table_schema = 'public'
      and column_name = 'family_id'
      and table_name not in ('families', 'profiles')
  ) as family_tables;

  -- Delete leaf tables first. When a table is still referenced, keep it for the
  -- next pass; this derives a safe order from the live local schema.
  while coalesce(array_length(remaining_tables, 1), 0) > 0 loop
    previous_count := array_length(remaining_tables, 1);
    foreach target_table in array remaining_tables loop
      begin
        execute format(
          'delete from public.%I where family_id = any($1)',
          target_table
        ) using family_ids;
        remaining_tables := array_remove(remaining_tables, target_table);
      exception
        when foreign_key_violation then
          null;
      end;
    end loop;

    if array_length(remaining_tables, 1) = previous_count then
      raise exception 'Could not safely order Phase 1.A fixture cleanup: %', remaining_tables;
    end if;
  end loop;

  delete from public.profiles where id = any(user_ids);
  delete from public.families where id = any(family_ids);
  delete from auth.users where id = any(user_ids);
end;
$$;

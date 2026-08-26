-- Local-test-only. Grows the characterization Household to a size where PostgreSQL's
-- planner choices are meaningful: 24 months of expenses and income, and 240 Monthly
-- Plan Revisions. Phase 2.B uses this to compare the query shapes it replaced.
do $$
declare
  household uuid := '20000000-0000-4000-8000-000000000001';
  owner_id uuid := '20000000-0000-4000-8000-000000000002';
  plan_id uuid := '20000000-0000-4000-8000-000000000e01';
  month_offset integer;
  entry integer;
begin
  for month_offset in 0..23 loop
    for entry in 1..250 loop
      insert into public.expense_entries (
        family_id, member_id, transaction_date, main_category, subcategory_id,
        amount, currency, note, created_by
      )
      values (
        household, owner_id,
        (date_trunc('month', current_date) - (month_offset || ' months')::interval)::date
          + (entry % 27),
        'essentials', '20000000-0000-4000-8000-000000000201',
        1000 + entry, 'DZD', 'Scaled characterization row', owner_id
      );
    end loop;

    insert into public.income_entries (
      family_id, member_id, source_id, income_month, amount, currency, note, created_by
    )
    values (
      household, owner_id, '20000000-0000-4000-8000-000000000101',
      (date_trunc('month', current_date) - (month_offset || ' months')::interval)::date,
      150000 + month_offset, 'DZD', 'Scaled characterization income', owner_id
    );
  end loop;

  -- Revision history is the growth the removed query was reading in full.
  for entry in 3..242 loop
    insert into public.monthly_plan_versions (
      monthly_plan_id, family_id, version_number, reason,
      essentials_percent, personal_percent, savings_percent,
      investment_percent, reserve_percent, created_by
    )
    values (
      plan_id, household, entry, 'Scaled revision ' || entry,
      50, 10, 20, 15, 5, owner_id
    );
  end loop;

  analyze public.expense_entries;
  analyze public.income_entries;
  analyze public.monthly_plan_versions;
  analyze public.monthly_plans;
end;
$$;

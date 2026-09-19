CREATE OR REPLACE FUNCTION public.generate_daily_sales_summary(
  p_business_date date DEFAULT ((now() AT TIME ZONE 'Asia/Jakarta')::date)
)
RETURNS public.daily_sales_summaries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_result public.daily_sales_summaries;
BEGIN
  IF auth.uid() IS NOT NULL
     AND NOT public.has_role(
       ARRAY['owner','admin','manager']::public.user_role[]
     )
  THEN
    RAISE EXCEPTION 'Insufficient permission';
  END IF;

  INSERT INTO public.daily_sales_summaries (
    business_date,
    total_sales,
    paid_transactions,
    cash_sales,
    card_sales,
    qris_sales,
    other_sales,
    generated_at
  )
  SELECT
    p_business_date,
    COALESCE(SUM(
      CASE
        WHEN p.status = 'paid' THEN p.amount
        ELSE 0
      END
    ), 0),

    COUNT(*) FILTER (WHERE p.status = 'paid'),

    COALESCE(SUM(
      CASE
        WHEN p.status = 'paid'
         AND p.method = 'cash'
        THEN p.amount
        ELSE 0
      END
    ), 0),

    COALESCE(SUM(
      CASE
        WHEN p.status = 'paid'
         AND p.method IN ('debit_card', 'credit_card')
        THEN p.amount
        ELSE 0
      END
    ), 0),

    COALESCE(SUM(
      CASE
        WHEN p.status = 'paid'
         AND p.method = 'qris'
        THEN p.amount
        ELSE 0
      END
    ), 0),

    COALESCE(SUM(
      CASE
        WHEN p.status = 'paid'
         AND p.method NOT IN (
           'cash',
           'debit_card',
           'credit_card',
           'qris'
         )
        THEN p.amount
        ELSE 0
      END
    ), 0),

    now()

  FROM public.payments p
  WHERE (p.paid_at AT TIME ZONE 'Asia/Jakarta')::date = p_business_date

  ON CONFLICT (business_date)
  DO UPDATE SET
    total_sales = EXCLUDED.total_sales,
    paid_transactions = EXCLUDED.paid_transactions,
    cash_sales = EXCLUDED.cash_sales,
    card_sales = EXCLUDED.card_sales,
    qris_sales = EXCLUDED.qris_sales,
    other_sales = EXCLUDED.other_sales,
    generated_at = now()

  RETURNING * INTO v_result;

  RETURN v_result;
END;
$function$;

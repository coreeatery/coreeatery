alter table public.promotions
  add column if not exists title_zh text,
  add column if not exists description_zh text,
  add column if not exists discount_text_id text,
  add column if not exists discount_text_en text,
  add column if not exists discount_text_zh text;

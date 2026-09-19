-- Add optional Simplified Chinese CMS content without modifying existing data.
alter table public.homepage_settings
  add column if not exists hero_title_zh text,
  add column if not exists hero_subtitle_zh text,
  add column if not exists about_title_zh text,
  add column if not exists about_description_zh text,
  add column if not exists reservation_title_zh text,
  add column if not exists reservation_description_zh text,
  add column if not exists reservation_button_text_zh text;

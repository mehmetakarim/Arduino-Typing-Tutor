-- ================================================================
-- Arduino Typing Tutor — Supabase Şeması
-- Supabase Dashboard → SQL Editor'da çalıştır
-- ================================================================

-- Kullanıcı rollerini sakla (auth.users'a ek metadata)
create table if not exists public.user_roles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null check (role in ('parent', 'teacher')),
  full_name   text,
  created_at  timestamptz default now()
);
alter table public.user_roles enable row level security;
create policy "Kullanıcı kendi rolünü okuyabilir"
  on public.user_roles for select using (auth.uid() = id);
create policy "Kullanıcı kendi rolünü yazabilir"
  on public.user_roles for insert with check (auth.uid() = id);
create policy "Kullanıcı kendi rolünü güncelleyebilir"
  on public.user_roles for update using (auth.uid() = id);

-- Sınıflar (öğretmene ait)
create table if not exists public.classes (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  code        text not null unique,  -- örn. ATT-5A-2026
  created_at  timestamptz default now()
);
alter table public.classes enable row level security;
create policy "Öğretmen kendi sınıflarını yönetebilir"
  on public.classes for all using (auth.uid() = teacher_id);
create policy "Herkes sınıf kodunu okuyabilir (katılmak için)"
  on public.classes for select using (true);

-- Öğrenci-sınıf bağlantısı
create table if not exists public.class_members (
  id          uuid primary key default gen_random_uuid(),
  class_id    uuid not null references public.classes(id) on delete cascade,
  profile_id  text not null,         -- yerel profil ID'si
  owner_id    uuid references auth.users(id) on delete set null,
  student_name text not null,
  joined_at   timestamptz default now(),
  unique (class_id, profile_id)
);
alter table public.class_members enable row level security;
create policy "Öğretmen sınıf üyelerini görebilir"
  on public.class_members for select
  using (exists (
    select 1 from public.classes
    where classes.id = class_members.class_id
      and classes.teacher_id = auth.uid()
  ));
create policy "Üye kendi kaydını ekleyebilir"
  on public.class_members for insert with check (auth.uid() = owner_id);
create policy "Üye kendi kaydını silebilir"
  on public.class_members for delete using (auth.uid() = owner_id);

-- Öğrenci ilerlemesi (bulut yedek)
create table if not exists public.progress (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  profile_id    text not null,
  data          jsonb not null,       -- UserProgress JSON
  updated_at    timestamptz default now(),
  unique (owner_id, profile_id)
);
alter table public.progress enable row level security;
create policy "Kullanıcı kendi progressini yönetebilir"
  on public.progress for all using (auth.uid() = owner_id);
create policy "Öğretmen bağlı öğrencilerin progressini görebilir"
  on public.progress for select
  using (exists (
    select 1 from public.class_members cm
    join public.classes c on c.id = cm.class_id
    where cm.profile_id = progress.profile_id
      and c.teacher_id = auth.uid()
  ));

-- Sınıf bazlı liderboard görünümü (materialized değil, view)
create or replace view public.class_leaderboard as
select
  cm.class_id,
  cm.student_name,
  cm.profile_id,
  (p.data->>'longestStreak')::int  as longest_streak,
  (
    select round(avg((ls->>'bestWPM')::numeric))
    from jsonb_array_elements(p.data->'lessonStats') ls
  ) as avg_wpm,
  (
    select round(avg((ls->>'bestAccuracy')::numeric))
    from jsonb_array_elements(p.data->'lessonStats') ls
  ) as avg_accuracy,
  jsonb_array_length(p.data->'completedLessons') as completed_lessons,
  jsonb_array_length(p.data->'badges')           as badge_count,
  p.updated_at
from public.class_members cm
left join public.progress p
  on p.profile_id = cm.profile_id;

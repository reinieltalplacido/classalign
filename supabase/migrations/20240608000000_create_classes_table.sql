-- Create classes table for user schedules
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  subject text not null,
  day text not null,
  time text not null,
  room text,
  professor text,
  color text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.classes enable row level security;

-- Policy: users can only access their own classes
create policy "Users can view own classes" on public.classes
  for select using (auth.uid() = user_id);

create policy "Users can insert own classes" on public.classes
  for insert with check (auth.uid() = user_id);

create policy "Users can update own classes" on public.classes
  for update using (auth.uid() = user_id);

create policy "Users can delete own classes" on public.classes
  for delete using (auth.uid() = user_id); 
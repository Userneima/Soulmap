alter table public.identities
    add column if not exists current_guess_name text,
    add column if not exists current_guess_avatar text,
    add column if not exists current_guess_selected_at timestamptz;

alter table public.channels
    add column if not exists current_reveal_map jsonb not null default '{}'::jsonb;

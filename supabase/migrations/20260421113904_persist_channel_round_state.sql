alter table public.channels
    add column if not exists current_round_theme text,
    add column if not exists current_round_god_name text,
    add column if not exists current_round_god_avatar text;

alter table public.channels
    drop constraint if exists channels_current_round_theme_check,
    add constraint channels_current_round_theme_check
        check (
            current_round_theme is null
            or char_length(btrim(current_round_theme)) between 1 and 24
        );

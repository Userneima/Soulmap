create or replace function private.generate_unique_channel_slug(source_name text)
returns text
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
    normalized_slug text;
    candidate_slug text;
begin
    normalized_slug := lower(coalesce(source_name, ''));
    normalized_slug := regexp_replace(normalized_slug, '[^a-z0-9]+', '-', 'g');
    normalized_slug := trim(both '-' from normalized_slug);

    if normalized_slug = '' then
        normalized_slug := 'channel-' || substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8);
    end if;

    candidate_slug := normalized_slug;

    while exists (
        select 1
        from public.channels
        where slug = candidate_slug
    ) loop
        candidate_slug := normalized_slug || '-' || substring(replace(gen_random_uuid()::text, '-', '') from 1 for 6);
    end loop;

    return candidate_slug;
end;
$$;

create or replace function private.create_channel_with_owner_internal(
    channel_name text,
    channel_description text default ''
)
returns table (
    created_channel_id uuid,
    created_channel_slug text,
    created_channel_name text
)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
    current_user_id uuid;
    current_profile public.profiles;
    created_channel public.channels;
    created_identity public.identities;
    trimmed_name text;
    trimmed_description text;
begin
    current_user_id := auth.uid();
    if current_user_id is null then
        raise exception 'Authentication is required.'
            using errcode = '42501';
    end if;

    if private.current_user_is_anonymous() then
        raise exception 'Anonymous users cannot create channels.'
            using errcode = '42501';
    end if;

    trimmed_name := btrim(coalesce(channel_name, ''));
    if trimmed_name = '' then
        raise exception 'Channel name is required.'
            using errcode = 'P0001';
    end if;

    trimmed_description := btrim(coalesce(channel_description, ''));

    select *
    into current_profile
    from public.profiles
    where id = current_user_id;

    if current_profile.id is null then
        insert into public.profiles (id, display_name)
        values (
            current_user_id,
            nullif(split_part(coalesce((auth.jwt() ->> 'email'), ''), '@', 1), '')
        )
        on conflict (id) do nothing;

        select *
        into current_profile
        from public.profiles
        where id = current_user_id;
    end if;

    insert into public.channels (
        slug,
        name,
        description,
        visibility,
        preview_visibility,
        join_policy,
        created_by
    )
    values (
        private.generate_unique_channel_slug(trimmed_name),
        trimmed_name,
        nullif(trimmed_description, ''),
        'public',
        'public',
        'approval_required',
        current_user_id
    )
    returning *
    into created_channel;

    insert into public.identities (
        channel_id,
        user_id,
        display_name,
        avatar_url,
        role
    )
    values (
        created_channel.id,
        current_user_id,
        coalesce(nullif(current_profile.display_name, ''), '频道主'),
        current_profile.avatar_url,
        'owner'
    )
    returning *
    into created_identity;

    perform private.ensure_default_alias_sessions(created_identity.id, created_channel.id);

    return query
    select
        created_channel.id,
        created_channel.slug,
        created_channel.name;
end;
$$;

create or replace function public.create_channel_with_owner(
    channel_name text,
    channel_description text default ''
)
returns table (
    created_channel_id uuid,
    created_channel_slug text,
    created_channel_name text
)
language sql
security invoker
set search_path = public, pg_temp
as $$
    select *
    from private.create_channel_with_owner_internal(channel_name, channel_description);
$$;

grant execute on function private.generate_unique_channel_slug(text) to authenticated;
grant execute on function private.create_channel_with_owner_internal(text, text) to authenticated;
grant execute on function public.create_channel_with_owner(text, text) to authenticated;

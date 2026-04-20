create or replace function private.get_current_channel_identity(target_channel_id uuid)
returns table (
    identity_id uuid,
    role text,
    display_name text,
    avatar_url text
)
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
    select
        identity_row.id,
        identity_row.role,
        identity_row.display_name,
        identity_row.avatar_url
    from public.identities identity_row
    where identity_row.channel_id = target_channel_id
      and identity_row.user_id = (select auth.uid())
    limit 1;
$$;

create or replace function public.get_my_channel_membership(target_channel_id uuid)
returns table (
    status text,
    role text,
    identity_id uuid,
    display_name text,
    avatar_url text
)
language plpgsql
stable
security invoker
set search_path = public, auth, pg_temp
as $$
declare
    identity_row record;
begin
    if (select auth.uid()) is null or private.current_user_is_anonymous() then
        return query
        select
            'guest'::text,
            null::text,
            null::uuid,
            null::text,
            null::text;
        return;
    end if;

    select *
    into identity_row
    from private.get_current_channel_identity(target_channel_id);

    if identity_row.identity_id is not null then
        return query
        select
            'approved'::text,
            identity_row.role::text,
            identity_row.identity_id::uuid,
            identity_row.display_name::text,
            identity_row.avatar_url::text;
        return;
    end if;

    return query
    select
        'guest'::text,
        null::text,
        null::uuid,
        null::text,
        null::text;
end;
$$;

grant execute on function public.get_my_channel_membership(uuid) to authenticated;

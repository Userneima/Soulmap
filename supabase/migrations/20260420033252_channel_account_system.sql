create table if not exists public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    display_name text,
    avatar_url text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.channel_join_requests (
    id uuid primary key default gen_random_uuid(),
    channel_id uuid not null references public.channels (id) on delete cascade,
    user_id uuid not null references auth.users (id) on delete cascade,
    status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
    message text,
    review_note text,
    reviewed_by uuid references auth.users (id) on delete set null,
    reviewed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.channels
    add column if not exists preview_visibility text not null default 'public',
    add column if not exists join_policy text not null default 'approval_required';

alter table public.channels
    drop constraint if exists channels_preview_visibility_check,
    add constraint channels_preview_visibility_check check (preview_visibility in ('private', 'public'));

alter table public.channels
    drop constraint if exists channels_join_policy_check,
    add constraint channels_join_policy_check check (join_policy in ('invite_only', 'approval_required', 'open'));

create index if not exists profiles_display_name_idx on public.profiles (display_name);
create index if not exists channel_join_requests_channel_idx on public.channel_join_requests (channel_id, status, created_at desc);
create index if not exists channel_join_requests_user_idx on public.channel_join_requests (user_id, created_at desc);
create unique index if not exists channel_join_requests_one_pending_idx
    on public.channel_join_requests (channel_id, user_id)
    where status = 'pending';

update public.channels
set preview_visibility = 'public',
    join_policy = 'approval_required',
    updated_at = now()
where preview_visibility is distinct from 'public'
   or join_policy is distinct from 'approval_required';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.profiles (id, display_name, avatar_url)
    values (
        new.id,
        nullif(
            coalesce(
                new.raw_user_meta_data ->> 'display_name',
                split_part(coalesce(new.email, ''), '@', 1)
            ),
            ''
        ),
        nullif(new.raw_user_meta_data ->> 'avatar_url', '')
    )
    on conflict (id) do nothing;

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

insert into public.profiles (id, display_name, avatar_url)
select
    users.id,
    nullif(
        coalesce(
            users.raw_user_meta_data ->> 'display_name',
            split_part(coalesce(users.email, ''), '@', 1)
        ),
        ''
    ),
    nullif(users.raw_user_meta_data ->> 'avatar_url', '')
from auth.users users
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.channel_join_requests enable row level security;

create or replace function private.current_user_is_anonymous()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
    select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false);
$$;

create or replace function private.channel_allows_public_preview(target_channel_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select exists (
        select 1
        from public.channels channel
        where channel.id = target_channel_id
          and channel.preview_visibility = 'public'
    );
$$;

create or replace function private.is_channel_member(target_channel_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
    select exists (
        select 1
        from public.identities membership
        where membership.channel_id = target_channel_id
          and membership.user_id = (select auth.uid())
    );
$$;

create or replace function private.is_channel_admin(target_channel_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
    select exists (
        select 1
        from public.identities membership
        where membership.channel_id = target_channel_id
          and membership.user_id = (select auth.uid())
          and membership.role in ('owner', 'admin')
    );
$$;

create or replace function private.owns_identity(target_identity_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
    select exists (
        select 1
        from public.identities actor_identity
        where actor_identity.id = target_identity_id
          and actor_identity.user_id = (select auth.uid())
    );
$$;

create or replace function private.owns_alias_session(target_alias_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
    select exists (
        select 1
        from public.alias_sessions actor_alias
        join public.identities owner_identity
          on owner_identity.id = actor_alias.identity_id
        where actor_alias.id = target_alias_session_id
          and owner_identity.user_id = (select auth.uid())
    );
$$;

create or replace function private.ensure_default_alias_sessions(target_identity_id uuid, target_channel_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    insert into public.alias_sessions (channel_id, identity_id, slot_key, display_name, avatar_url)
    values
        (
            target_channel_id,
            target_identity_id,
            'slot-baiyu',
            '白榆',
            'https://lh3.googleusercontent.com/aida-public/AB6AXuAAF1xIAURg4pscz_NBpuuG-SxRtXMwz7Bj6kZwsrWNFW-odFm30orXRucNJOPwamQYgZR1TEIhZkL5O10eQJtvrDM8t822PyG2dKeoOvKHYsw6ZeMXaQUv-mcoKFb2ir32XD-DN4ZbVpW9SN4fPdJet1EmrS2L2uG_zqMTRQUXqC6d13nTjeInGSZrwvkq2IMSe99646zSnQdupaTxFNMC0rzDB4UquXVWmFsLO4Ial8RT0DgamryGslxLm-1OIJTEdDTRdHXJjC4'
        ),
        (
            target_channel_id,
            target_identity_id,
            'slot-beiqiao',
            '北桥',
            'https://lh3.googleusercontent.com/aida-public/AB6AXuCcKwUvE26sD93HXFPeaZKG4rcO46TtVUuH82BX4ziwxtQO6LqUqi7htZJg5ldPwrXuMlk-2HE9PBqh4V3ripA5SFIRoJzC1z5TUHOahBodZdJ6nyPtbI3ueAl8kH5khm1HV62UVFoUCxs9G6GCSfF6BwWaSCx8Mo7j_89w8D_bdtvADDehJLb4t9gCgUFtvyQYlkfWhwEvSG3zS91PnAoiMUsN4C6EDpZP2lxYDUwhc8vX9KFUg80eEZgmyLjAUr2k7jQ0cGijT-A'
        ),
        (
            target_channel_id,
            target_identity_id,
            'slot-haiyu',
            '海屿',
            'https://lh3.googleusercontent.com/aida-public/AB6AXuD7dADvgkUZTmxeXdVrXRGz76Ic6R6Wd6I4KZ1sPj4qgDDug3FSXbt2MHfAjLymGrdxs1loOM-lwzNDWfpjTfON7UuMTrWPl053BjvRGm_VZdQLUtD9KvLKwjz03l_X740oiKoRp8XGKaK_swULjXNS4iVPZr2Oult7W_RibE_RDDkx_dg75u32hmhdVNzVPyVRbrBVe9bJt0Utq1RZTnetWnhQFsWzK7GZYVWtLQsMrGURY_piyy7q5wJq2TUz2sc2IWSw6UTn2wE'
        ),
        (
            target_channel_id,
            target_identity_id,
            'slot-yunqi',
            '云栖',
            'https://lh3.googleusercontent.com/aida-public/AB6AXuAMEcp_Gb2H95x3OK1WiHC-EzuWE003ywUAtg9SEVazxij0OCuoZ50_DrAn602n1xUaJmFqPITtx0LAknqLJzjQz9eO6w6a9Ak9r77Qp9_EzQPiKdoNVrvoQ1LaimRB6o8UOT5Q_WRzhrKcmgvZYNePZUUiORLaFawGrWHI_8yS8gqV-JuBxX9sDrx2FEr1gcRL1qlAoW9oXheuh309Vm9ygZmwKzVA8_iJS66DcBDj1vo1aetR7EVQKdABFPiEu_vlhKfkrn0ArYk'
        )
    on conflict (channel_id, identity_id, slot_key) do nothing;
end;
$$;

create or replace function public.ensure_my_alias_sessions(target_channel_id uuid)
returns setof public.alias_sessions
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
    identity_row public.identities;
begin
    if private.current_user_is_anonymous() then
        raise exception 'Anonymous users cannot initialize member aliases.'
            using errcode = '42501';
    end if;

    select *
    into identity_row
    from public.identities
    where channel_id = target_channel_id
      and user_id = (select auth.uid());

    if identity_row.id is null then
        raise exception 'Current user is not an approved channel member.'
            using errcode = '42501';
    end if;

    perform private.ensure_default_alias_sessions(identity_row.id, target_channel_id);

    return query
    select *
    from public.alias_sessions
    where identity_id = identity_row.id
      and channel_id = target_channel_id
    order by slot_key;
end;
$$;

create or replace function public.approve_channel_join_request(target_request_id uuid)
returns public.channel_join_requests
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
    request_row public.channel_join_requests;
    identity_row public.identities;
    profile_row public.profiles;
begin
    select *
    into request_row
    from public.channel_join_requests
    where id = target_request_id
    for update;

    if request_row.id is null then
        raise exception 'Join request not found.'
            using errcode = 'P0002';
    end if;

    if not private.is_channel_admin(request_row.channel_id) then
        raise exception 'Only channel admins can approve join requests.'
            using errcode = '42501';
    end if;

    if request_row.status <> 'pending' then
        raise exception 'Only pending requests can be approved.'
            using errcode = 'P0001';
    end if;

    select *
    into profile_row
    from public.profiles
    where id = request_row.user_id;

    insert into public.identities (channel_id, user_id, display_name, avatar_url, role)
    values (
        request_row.channel_id,
        request_row.user_id,
        coalesce(nullif(profile_row.display_name, ''), '频道成员'),
        profile_row.avatar_url,
        'member'
    )
    on conflict (channel_id, user_id) do update
    set display_name = coalesce(public.identities.display_name, excluded.display_name),
        avatar_url = coalesce(public.identities.avatar_url, excluded.avatar_url),
        updated_at = now()
    returning *
    into identity_row;

    perform private.ensure_default_alias_sessions(identity_row.id, request_row.channel_id);

    update public.channel_join_requests
    set status = 'approved',
        reviewed_by = (select auth.uid()),
        reviewed_at = now(),
        updated_at = now()
    where id = target_request_id
    returning *
    into request_row;

    return request_row;
end;
$$;

create or replace function public.reject_channel_join_request(target_request_id uuid, rejection_note text default null)
returns public.channel_join_requests
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
    request_row public.channel_join_requests;
begin
    select *
    into request_row
    from public.channel_join_requests
    where id = target_request_id
    for update;

    if request_row.id is null then
        raise exception 'Join request not found.'
            using errcode = 'P0002';
    end if;

    if not private.is_channel_admin(request_row.channel_id) then
        raise exception 'Only channel admins can reject join requests.'
            using errcode = '42501';
    end if;

    if request_row.status <> 'pending' then
        raise exception 'Only pending requests can be rejected.'
            using errcode = 'P0001';
    end if;

    update public.channel_join_requests
    set status = 'rejected',
        review_note = rejection_note,
        reviewed_by = (select auth.uid()),
        reviewed_at = now(),
        updated_at = now()
    where id = target_request_id
    returning *
    into request_row;

    return request_row;
end;
$$;

grant usage on schema private to anon, authenticated;
grant execute on function private.current_user_is_anonymous() to anon, authenticated;
grant execute on function private.channel_allows_public_preview(uuid) to anon, authenticated;
grant execute on function private.is_channel_member(uuid) to anon, authenticated;
grant execute on function private.is_channel_admin(uuid) to authenticated;
grant execute on function private.owns_identity(uuid) to authenticated;
grant execute on function private.owns_alias_session(uuid) to authenticated;
grant execute on function public.ensure_my_alias_sessions(uuid) to authenticated;
grant execute on function public.approve_channel_join_request(uuid) to authenticated;
grant execute on function public.reject_channel_join_request(uuid, text) to authenticated;

drop policy if exists "Authenticated users can view channels" on public.channels;
drop policy if exists "Users can create channels" on public.channels;
drop policy if exists "Channel owners can update channels" on public.channels;
drop policy if exists "Channel owners can delete channels" on public.channels;
drop policy if exists "Channel members can view identities" on public.identities;
drop policy if exists "Users can create their own identity" on public.identities;
drop policy if exists "Users can update their own identity" on public.identities;
drop policy if exists "Users can delete their own identity" on public.identities;
drop policy if exists "Channel members can view alias sessions" on public.alias_sessions;
drop policy if exists "Users can create their own alias sessions" on public.alias_sessions;
drop policy if exists "Users can update their own alias sessions" on public.alias_sessions;
drop policy if exists "Users can delete their own alias sessions" on public.alias_sessions;
drop policy if exists "Channel members can view posts" on public.posts;
drop policy if exists "Users can create posts through their own identity or alias" on public.posts;
drop policy if exists "Users can update their own posts" on public.posts;
drop policy if exists "Users can delete their own posts" on public.posts;
drop policy if exists "Channel members can view comments" on public.comments;
drop policy if exists "Users can create comments through their own identity or alias" on public.comments;
drop policy if exists "Users can update their own comments" on public.comments;
drop policy if exists "Users can delete their own comments" on public.comments;

create policy "Public preview can view channels"
on public.channels
for select
to anon, authenticated
using (
    channels.preview_visibility = 'public'
    or private.is_channel_member(channels.id)
);

create policy "Authenticated users can create channels"
on public.channels
for insert
to authenticated
with check (
    not private.current_user_is_anonymous()
    and (select auth.uid()) = created_by
);

create policy "Channel owners can update channels"
on public.channels
for update
to authenticated
using (
    not private.current_user_is_anonymous()
    and (
        channels.created_by = (select auth.uid())
        or private.is_channel_admin(channels.id)
    )
)
with check (
    not private.current_user_is_anonymous()
    and (
        channels.created_by = (select auth.uid())
        or private.is_channel_admin(channels.id)
    )
);

create policy "Channel owners can delete channels"
on public.channels
for delete
to authenticated
using (
    not private.current_user_is_anonymous()
    and channels.created_by = (select auth.uid())
);

create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = profiles.id);

create policy "Users can create their own profile"
on public.profiles
for insert
to authenticated
with check (
    not private.current_user_is_anonymous()
    and (select auth.uid()) = profiles.id
);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (
    not private.current_user_is_anonymous()
    and (select auth.uid()) = profiles.id
)
with check (
    not private.current_user_is_anonymous()
    and (select auth.uid()) = profiles.id
);

create policy "Approved members can view identities"
on public.identities
for select
to authenticated
using (
    not private.current_user_is_anonymous()
    and private.is_channel_member(identities.channel_id)
);

create policy "Approved members can update their own identity"
on public.identities
for update
to authenticated
using (
    not private.current_user_is_anonymous()
    and (select auth.uid()) = identities.user_id
)
with check (
    not private.current_user_is_anonymous()
    and (select auth.uid()) = identities.user_id
);

create policy "Approved members can view alias sessions"
on public.alias_sessions
for select
to authenticated
using (
    not private.current_user_is_anonymous()
    and private.is_channel_member(alias_sessions.channel_id)
);

create policy "Approved members can create their own alias sessions"
on public.alias_sessions
for insert
to authenticated
with check (
    not private.current_user_is_anonymous()
    and private.owns_identity(alias_sessions.identity_id)
    and exists (
        select 1
        from public.identities owner_identity
        where owner_identity.id = alias_sessions.identity_id
          and owner_identity.channel_id = alias_sessions.channel_id
          and owner_identity.user_id = (select auth.uid())
    )
);

create policy "Approved members can update their own alias sessions"
on public.alias_sessions
for update
to authenticated
using (
    not private.current_user_is_anonymous()
    and private.owns_identity(alias_sessions.identity_id)
)
with check (
    not private.current_user_is_anonymous()
    and private.owns_identity(alias_sessions.identity_id)
);

create policy "Public preview can view posts"
on public.posts
for select
to anon, authenticated
using (
    private.channel_allows_public_preview(posts.channel_id)
    or private.is_channel_member(posts.channel_id)
);

create policy "Approved members can create posts"
on public.posts
for insert
to authenticated
with check (
    not private.current_user_is_anonymous()
    and private.is_channel_member(posts.channel_id)
    and (
        (
            posts.identity_id is not null
            and private.owns_identity(posts.identity_id)
            and exists (
                select 1
                from public.identities actor_identity
                where actor_identity.id = posts.identity_id
                  and actor_identity.channel_id = posts.channel_id
            )
        )
        or (
            posts.alias_session_id is not null
            and private.owns_alias_session(posts.alias_session_id)
            and exists (
                select 1
                from public.alias_sessions actor_alias
                where actor_alias.id = posts.alias_session_id
                  and actor_alias.channel_id = posts.channel_id
            )
        )
    )
);

create policy "Approved members can update their own posts"
on public.posts
for update
to authenticated
using (
    not private.current_user_is_anonymous()
    and (
        private.owns_identity(posts.identity_id)
        or private.owns_alias_session(posts.alias_session_id)
    )
)
with check (
    not private.current_user_is_anonymous()
    and private.is_channel_member(posts.channel_id)
    and (
        private.owns_identity(posts.identity_id)
        or private.owns_alias_session(posts.alias_session_id)
    )
);

create policy "Approved members can delete their own posts"
on public.posts
for delete
to authenticated
using (
    not private.current_user_is_anonymous()
    and (
        private.owns_identity(posts.identity_id)
        or private.owns_alias_session(posts.alias_session_id)
    )
);

create policy "Public preview can view comments"
on public.comments
for select
to anon, authenticated
using (
    private.channel_allows_public_preview(comments.channel_id)
    or private.is_channel_member(comments.channel_id)
);

create policy "Approved members can create comments"
on public.comments
for insert
to authenticated
with check (
    not private.current_user_is_anonymous()
    and private.is_channel_member(comments.channel_id)
    and (
        (
            comments.identity_id is not null
            and private.owns_identity(comments.identity_id)
            and exists (
                select 1
                from public.identities actor_identity
                where actor_identity.id = comments.identity_id
                  and actor_identity.channel_id = comments.channel_id
            )
        )
        or (
            comments.alias_session_id is not null
            and private.owns_alias_session(comments.alias_session_id)
            and exists (
                select 1
                from public.alias_sessions actor_alias
                where actor_alias.id = comments.alias_session_id
                  and actor_alias.channel_id = comments.channel_id
            )
        )
    )
);

create policy "Approved members can update their own comments"
on public.comments
for update
to authenticated
using (
    not private.current_user_is_anonymous()
    and (
        private.owns_identity(comments.identity_id)
        or private.owns_alias_session(comments.alias_session_id)
    )
)
with check (
    not private.current_user_is_anonymous()
    and private.is_channel_member(comments.channel_id)
    and (
        private.owns_identity(comments.identity_id)
        or private.owns_alias_session(comments.alias_session_id)
    )
);

create policy "Approved members can delete their own comments"
on public.comments
for delete
to authenticated
using (
    not private.current_user_is_anonymous()
    and (
        private.owns_identity(comments.identity_id)
        or private.owns_alias_session(comments.alias_session_id)
    )
);

create policy "Users can read their own or managed join requests"
on public.channel_join_requests
for select
to authenticated
using (
    not private.current_user_is_anonymous()
    and (
        channel_join_requests.user_id = (select auth.uid())
        or private.is_channel_admin(channel_join_requests.channel_id)
    )
);

create policy "Users can submit their own join requests"
on public.channel_join_requests
for insert
to authenticated
with check (
    not private.current_user_is_anonymous()
    and channel_join_requests.user_id = (select auth.uid())
    and channel_join_requests.status = 'pending'
    and exists (
        select 1
        from public.channels channel
        where channel.id = channel_join_requests.channel_id
          and channel.join_policy in ('approval_required', 'open')
    )
    and not exists (
        select 1
        from public.identities membership
        where membership.channel_id = channel_join_requests.channel_id
          and membership.user_id = (select auth.uid())
    )
);

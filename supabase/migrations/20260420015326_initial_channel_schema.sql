create table public.channels (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique,
    name text not null,
    description text,
    visibility text not null default 'private' check (visibility in ('private', 'public')),
    created_by uuid not null references auth.users (id) on delete restrict,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.identities (
    id uuid primary key default gen_random_uuid(),
    channel_id uuid not null references public.channels (id) on delete cascade,
    user_id uuid not null references auth.users (id) on delete cascade,
    display_name text not null check (char_length(btrim(display_name)) between 1 and 32),
    avatar_url text,
    role text not null default 'member' check (role in ('owner', 'admin', 'member')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (channel_id, user_id)
);

create table public.alias_sessions (
    id uuid primary key default gen_random_uuid(),
    channel_id uuid not null references public.channels (id) on delete cascade,
    identity_id uuid not null references public.identities (id) on delete cascade,
    slot_key text not null,
    display_name text not null check (char_length(btrim(display_name)) between 1 and 32),
    avatar_url text,
    status text not null default 'active' check (status in ('active', 'retired')),
    last_used_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    unique (channel_id, identity_id, slot_key)
);

create table public.posts (
    id uuid primary key default gen_random_uuid(),
    channel_id uuid not null references public.channels (id) on delete cascade,
    board_slug text,
    identity_id uuid references public.identities (id) on delete set null,
    alias_session_id uuid references public.alias_sessions (id) on delete set null,
    body text not null default '',
    media jsonb not null default '[]'::jsonb,
    ai_disclosure text not null default 'none' check (ai_disclosure in ('none', 'ai-generated')),
    views_count integer not null default 0 check (views_count >= 0),
    likes_count integer not null default 0 check (likes_count >= 0),
    shares_count integer not null default 0 check (shares_count >= 0),
    comments_count integer not null default 0 check (comments_count >= 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint posts_author_check check ((identity_id is not null) <> (alias_session_id is not null)),
    constraint posts_content_check check (char_length(btrim(body)) > 0 or jsonb_array_length(media) > 0)
);

create table public.comments (
    id uuid primary key default gen_random_uuid(),
    post_id uuid not null references public.posts (id) on delete cascade,
    channel_id uuid not null references public.channels (id) on delete cascade,
    identity_id uuid references public.identities (id) on delete set null,
    alias_session_id uuid references public.alias_sessions (id) on delete set null,
    body text not null check (char_length(btrim(body)) > 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint comments_author_check check ((identity_id is not null) <> (alias_session_id is not null))
);

create index channels_created_by_idx on public.channels (created_by);
create index identities_channel_user_idx on public.identities (channel_id, user_id);
create index alias_sessions_channel_identity_idx on public.alias_sessions (channel_id, identity_id);
create index posts_channel_created_at_idx on public.posts (channel_id, created_at desc);
create index posts_board_slug_idx on public.posts (board_slug);
create index comments_post_created_at_idx on public.comments (post_id, created_at asc);
create index comments_channel_idx on public.comments (channel_id);

create schema if not exists private;

revoke all on schema private from public;

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

grant usage on schema private to authenticated;
grant execute on function private.is_channel_member(uuid) to authenticated;
grant execute on function private.owns_identity(uuid) to authenticated;
grant execute on function private.owns_alias_session(uuid) to authenticated;

alter table public.channels enable row level security;
alter table public.identities enable row level security;
alter table public.alias_sessions enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;

create policy "Authenticated users can view channels"
on public.channels
for select
to authenticated
using (true);

create policy "Users can create channels"
on public.channels
for insert
to authenticated
with check ((select auth.uid()) = created_by);

create policy "Channel owners can update channels"
on public.channels
for update
to authenticated
using ((select auth.uid()) = created_by)
with check ((select auth.uid()) = created_by);

create policy "Channel owners can delete channels"
on public.channels
for delete
to authenticated
using ((select auth.uid()) = created_by);

create policy "Channel members can view identities"
on public.identities
for select
to authenticated
using (
    identities.user_id = (select auth.uid())
    or (select private.is_channel_member(identities.channel_id))
);

create policy "Users can create their own identity"
on public.identities
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own identity"
on public.identities
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own identity"
on public.identities
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Channel members can view alias sessions"
on public.alias_sessions
for select
to authenticated
using ((select private.is_channel_member(alias_sessions.channel_id)));

create policy "Users can create their own alias sessions"
on public.alias_sessions
for insert
to authenticated
with check (
    (select private.owns_identity(alias_sessions.identity_id))
    and exists (
        select 1
        from public.identities owner_identity
        where owner_identity.id = alias_sessions.identity_id
          and owner_identity.channel_id = alias_sessions.channel_id
    )
);

create policy "Users can update their own alias sessions"
on public.alias_sessions
for update
to authenticated
using (
    (select private.owns_identity(alias_sessions.identity_id))
)
with check (
    (select private.owns_identity(alias_sessions.identity_id))
    and exists (
        select 1
        from public.identities owner_identity
        where owner_identity.id = alias_sessions.identity_id
          and owner_identity.channel_id = alias_sessions.channel_id
    )
);

create policy "Users can delete their own alias sessions"
on public.alias_sessions
for delete
to authenticated
using (
    (select private.owns_identity(alias_sessions.identity_id))
);

create policy "Channel members can view posts"
on public.posts
for select
to authenticated
using ((select private.is_channel_member(posts.channel_id)));

create policy "Users can create posts through their own identity or alias"
on public.posts
for insert
to authenticated
with check (
    (select private.is_channel_member(posts.channel_id))
    and (
        (select private.owns_identity(posts.identity_id))
        or (select private.owns_alias_session(posts.alias_session_id))
    )
    and (
        exists (
            select 1
            from public.identities actor_identity
            where actor_identity.id = posts.identity_id
              and actor_identity.channel_id = posts.channel_id
        )
        or exists (
            select 1
            from public.alias_sessions actor_alias
            where actor_alias.id = posts.alias_session_id
              and actor_alias.channel_id = posts.channel_id
        )
    )
);

create policy "Users can update their own posts"
on public.posts
for update
to authenticated
using (
    (select private.owns_identity(posts.identity_id))
    or (select private.owns_alias_session(posts.alias_session_id))
)
with check (
    (select private.is_channel_member(posts.channel_id))
    and (
        (select private.owns_identity(posts.identity_id))
        or (select private.owns_alias_session(posts.alias_session_id))
    )
    and (
        exists (
            select 1
            from public.identities actor_identity
            where actor_identity.id = posts.identity_id
              and actor_identity.channel_id = posts.channel_id
        )
        or exists (
            select 1
            from public.alias_sessions actor_alias
            where actor_alias.id = posts.alias_session_id
              and actor_alias.channel_id = posts.channel_id
        )
    )
);

create policy "Users can delete their own posts"
on public.posts
for delete
to authenticated
using (
    (select private.owns_identity(posts.identity_id))
    or (select private.owns_alias_session(posts.alias_session_id))
);

create policy "Channel members can view comments"
on public.comments
for select
to authenticated
using ((select private.is_channel_member(comments.channel_id)));

create policy "Users can create comments through their own identity or alias"
on public.comments
for insert
to authenticated
with check (
    (select private.is_channel_member(comments.channel_id))
    and (
        (select private.owns_identity(comments.identity_id))
        or (select private.owns_alias_session(comments.alias_session_id))
    )
    and (
        exists (
            select 1
            from public.identities actor_identity
            where actor_identity.id = comments.identity_id
              and actor_identity.channel_id = comments.channel_id
        )
        or exists (
            select 1
            from public.alias_sessions actor_alias
            where actor_alias.id = comments.alias_session_id
              and actor_alias.channel_id = comments.channel_id
        )
    )
);

create policy "Users can update their own comments"
on public.comments
for update
to authenticated
using (
    (select private.owns_identity(comments.identity_id))
    or (select private.owns_alias_session(comments.alias_session_id))
)
with check (
    (select private.is_channel_member(comments.channel_id))
    and (
        (select private.owns_identity(comments.identity_id))
        or (select private.owns_alias_session(comments.alias_session_id))
    )
    and (
        exists (
            select 1
            from public.identities actor_identity
            where actor_identity.id = comments.identity_id
              and actor_identity.channel_id = comments.channel_id
        )
        or exists (
            select 1
            from public.alias_sessions actor_alias
            where actor_alias.id = comments.alias_session_id
              and actor_alias.channel_id = comments.channel_id
        )
    )
);

create policy "Users can delete their own comments"
on public.comments
for delete
to authenticated
using (
    (select private.owns_identity(comments.identity_id))
    or (select private.owns_alias_session(comments.alias_session_id))
);

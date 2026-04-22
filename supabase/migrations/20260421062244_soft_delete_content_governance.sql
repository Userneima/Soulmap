alter table public.posts
add column if not exists deleted_at timestamptz,
add column if not exists deleted_by uuid references auth.users (id) on delete set null,
add column if not exists deleted_snapshot jsonb not null default '{}'::jsonb;

alter table public.comments
add column if not exists deleted_at timestamptz,
add column if not exists deleted_by uuid references auth.users (id) on delete set null,
add column if not exists deleted_snapshot jsonb not null default '{}'::jsonb;

create index if not exists posts_deleted_at_idx on public.posts (deleted_at);
create index if not exists comments_deleted_at_idx on public.comments (deleted_at);

drop policy if exists "Approved members can delete their own posts" on public.posts;
drop policy if exists "Approved members can delete their own comments" on public.comments;

drop policy if exists "Approved members can update their own posts" on public.posts;
create policy "Approved members can update their own posts"
on public.posts
for update
to authenticated
using (
    not private.current_user_is_anonymous()
    and posts.deleted_at is null
    and (
        private.owns_identity(posts.identity_id)
        or private.owns_alias_session(posts.alias_session_id)
    )
)
with check (
    not private.current_user_is_anonymous()
    and posts.deleted_at is null
    and private.is_channel_member(posts.channel_id)
    and (
        private.owns_identity(posts.identity_id)
        or private.owns_alias_session(posts.alias_session_id)
    )
);

drop policy if exists "Approved members can update their own comments" on public.comments;
create policy "Approved members can update their own comments"
on public.comments
for update
to authenticated
using (
    not private.current_user_is_anonymous()
    and comments.deleted_at is null
    and (
        private.owns_identity(comments.identity_id)
        or private.owns_alias_session(comments.alias_session_id)
    )
)
with check (
    not private.current_user_is_anonymous()
    and comments.deleted_at is null
    and private.is_channel_member(comments.channel_id)
    and (
        private.owns_identity(comments.identity_id)
        or private.owns_alias_session(comments.alias_session_id)
    )
);

create or replace function private.guard_comment_insert_against_deleted_targets()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
    if exists (
        select 1
        from public.posts post_row
        where post_row.id = new.post_id
          and post_row.deleted_at is not null
    ) then
        raise exception 'Deleted post cannot accept new comments.'
            using errcode = '42501';
    end if;

    if new.parent_comment_id is not null and exists (
        select 1
        from public.comments parent_comment
        where parent_comment.id = new.parent_comment_id
          and parent_comment.deleted_at is not null
    ) then
        raise exception 'Deleted comment cannot be replied to.'
            using errcode = '42501';
    end if;

    return new;
end;
$$;

drop trigger if exists comments_guard_soft_deleted_targets on public.comments;
create trigger comments_guard_soft_deleted_targets
before insert on public.comments
for each row
execute function private.guard_comment_insert_against_deleted_targets();

create or replace function private.soft_delete_post_impl(target_post_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
    actor_id uuid := (select auth.uid());
    post_row public.posts%rowtype;
    owns_content boolean := false;
    can_moderate boolean := false;
begin
    if actor_id is null or private.current_user_is_anonymous() then
        raise exception 'Only authenticated approved members can delete posts.'
            using errcode = '42501';
    end if;

    select *
    into post_row
    from public.posts
    where id = target_post_id;

    if not found then
        raise exception 'Post not found.'
            using errcode = 'P0002';
    end if;

    owns_content := private.owns_identity(post_row.identity_id) or private.owns_alias_session(post_row.alias_session_id);
    can_moderate := private.is_channel_admin(post_row.channel_id);

    if not owns_content and not can_moderate then
        raise exception 'Current user cannot delete this post.'
            using errcode = '42501';
    end if;

    if post_row.deleted_at is not null then
        return jsonb_build_object(
            'post_id', post_row.id,
            'channel_id', post_row.channel_id,
            'already_deleted', true
        );
    end if;

    update public.posts next_post
    set body = '该帖子已删除',
        media = '[]'::jsonb,
        ai_disclosure = 'none',
        likes_count = 0,
        shares_count = 0,
        deleted_at = now(),
        deleted_by = actor_id,
        deleted_snapshot = jsonb_build_object(
            'body', next_post.body,
            'media', next_post.media,
            'ai_disclosure', next_post.ai_disclosure,
            'likes_count', next_post.likes_count,
            'shares_count', next_post.shares_count,
            'deleted_by_moderator', can_moderate and not owns_content
        ),
        updated_at = now()
    where next_post.id = target_post_id;

    return jsonb_build_object(
        'post_id', post_row.id,
        'channel_id', post_row.channel_id,
        'already_deleted', false
    );
end;
$$;

create or replace function private.soft_delete_comment_impl(target_comment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
    actor_id uuid := (select auth.uid());
    comment_row public.comments%rowtype;
    owns_content boolean := false;
    can_moderate boolean := false;
begin
    if actor_id is null or private.current_user_is_anonymous() then
        raise exception 'Only authenticated approved members can delete comments.'
            using errcode = '42501';
    end if;

    select *
    into comment_row
    from public.comments
    where id = target_comment_id;

    if not found then
        raise exception 'Comment not found.'
            using errcode = 'P0002';
    end if;

    owns_content := private.owns_identity(comment_row.identity_id) or private.owns_alias_session(comment_row.alias_session_id);
    can_moderate := private.is_channel_admin(comment_row.channel_id);

    if not owns_content and not can_moderate then
        raise exception 'Current user cannot delete this comment.'
            using errcode = '42501';
    end if;

    if comment_row.deleted_at is not null then
        return jsonb_build_object(
            'comment_id', comment_row.id,
            'post_id', comment_row.post_id,
            'channel_id', comment_row.channel_id,
            'already_deleted', true
        );
    end if;

    update public.comments next_comment
    set body = '该评论已删除',
        likes_count = 0,
        deleted_at = now(),
        deleted_by = actor_id,
        deleted_snapshot = jsonb_build_object(
            'body', next_comment.body,
            'likes_count', next_comment.likes_count,
            'parent_comment_id', next_comment.parent_comment_id,
            'deleted_by_moderator', can_moderate and not owns_content
        ),
        updated_at = now()
    where next_comment.id = target_comment_id;

    return jsonb_build_object(
        'comment_id', comment_row.id,
        'post_id', comment_row.post_id,
        'channel_id', comment_row.channel_id,
        'already_deleted', false
    );
end;
$$;

grant execute on function private.soft_delete_post_impl(uuid) to authenticated;
grant execute on function private.soft_delete_comment_impl(uuid) to authenticated;

create or replace function public.soft_delete_post(target_post_id uuid)
returns jsonb
language sql
set search_path = public, pg_temp
as $$
    select private.soft_delete_post_impl(target_post_id);
$$;

create or replace function public.soft_delete_comment(target_comment_id uuid)
returns jsonb
language sql
set search_path = public, pg_temp
as $$
    select private.soft_delete_comment_impl(target_comment_id);
$$;

grant execute on function public.soft_delete_post(uuid) to authenticated;
grant execute on function public.soft_delete_comment(uuid) to authenticated;

create or replace function public.increment_post_like(target_post_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
    next_likes_count integer;
begin
    if (select auth.uid()) is null or private.current_user_is_anonymous() then
        raise exception 'Only authenticated channel members can like posts.'
            using errcode = '42501';
    end if;

    update public.posts post_row
    set likes_count = post_row.likes_count + 1,
        updated_at = now()
    where post_row.id = target_post_id
      and post_row.deleted_at is null
      and exists (
          select 1
          from public.identities membership
          where membership.channel_id = post_row.channel_id
            and membership.user_id = (select auth.uid())
      )
    returning post_row.likes_count into next_likes_count;

    if next_likes_count is null then
        raise exception 'Post not found or current user cannot like this post.'
            using errcode = '42501';
    end if;

    return next_likes_count;
end;
$$;

create or replace function public.increment_comment_like(target_comment_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
    next_likes_count integer;
begin
    if (select auth.uid()) is null or private.current_user_is_anonymous() then
        raise exception 'Only authenticated channel members can like comments.'
            using errcode = '42501';
    end if;

    update public.comments comment_row
    set likes_count = comment_row.likes_count + 1,
        updated_at = now()
    where comment_row.id = target_comment_id
      and comment_row.deleted_at is null
      and exists (
          select 1
          from public.posts post_row
          where post_row.id = comment_row.post_id
            and post_row.deleted_at is null
      )
      and exists (
          select 1
          from public.identities membership
          where membership.channel_id = comment_row.channel_id
            and membership.user_id = (select auth.uid())
      )
    returning comment_row.likes_count into next_likes_count;

    if next_likes_count is null then
        raise exception 'Comment not found or current user cannot like this comment.'
            using errcode = '42501';
    end if;

    return next_likes_count;
end;
$$;

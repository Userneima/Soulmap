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

grant execute on function public.increment_post_like(uuid) to authenticated;

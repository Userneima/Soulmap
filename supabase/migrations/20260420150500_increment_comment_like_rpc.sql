alter table public.comments
add column if not exists likes_count integer not null default 0 check (likes_count >= 0);

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
      and exists (
          select 1
          from public.posts post_row
          join public.identities membership
            on membership.channel_id = post_row.channel_id
         where post_row.id = comment_row.post_id
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

grant execute on function public.increment_comment_like(uuid) to authenticated;

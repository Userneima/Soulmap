alter table public.identities
    add column if not exists current_claim_post_id uuid references public.posts (id) on delete set null,
    add column if not exists current_claim_selected_at timestamptz;

create index if not exists identities_current_claim_post_idx
    on public.identities (current_claim_post_id);

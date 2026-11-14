-- The reply foreign key is (parent_id, thread_id). Index both columns in that order.
-- The older single column index comments_parent_id_idx is now redundant and can be dropped later.
create index comments_parent_id_thread_id_idx on public.comments (parent_id, thread_id);

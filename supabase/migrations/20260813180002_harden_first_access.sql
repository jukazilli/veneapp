-- First-access completion is performed by an authenticated Server Action with
-- the server-only service role. Keep no SECURITY DEFINER RPC in the public API.
drop function if exists public.complete_first_access();
drop index if exists public.profiles_invited_by_idx;

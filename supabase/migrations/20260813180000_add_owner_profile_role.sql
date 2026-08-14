-- The enum value must be committed before it can be referenced by the next migration.
alter type public.profile_role add value if not exists 'owner' before 'admin';

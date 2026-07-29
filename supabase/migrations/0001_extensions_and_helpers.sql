-- 0001_extensions_and_helpers.sql
-- Zelp Phase 1: extensions required by the schema.
--
-- Naming note: the Supabase CLI was not detected in this environment (no
-- supabase/config.toml, no `supabase` binary on PATH), so these migrations
-- use plain sequential numbering (0001, 0002, ...) instead of the CLI's
-- `<timestamp>_<name>.sql` convention. If the project is later linked to the
-- Supabase CLI, these files can be renamed to timestamped filenames without
-- any change to their contents -- `supabase db push` / `migration list`
-- keys off the filename, not file contents.
--
-- All statements in this migration set are written to be safe to re-run
-- (create-if-not-exists / create-or-replace / drop-if-exists-then-create)
-- since this may be applied more than once against the same project during
-- development.

-- gen_random_uuid() lives in pgcrypto. Supabase projects usually have this
-- enabled already, but we make it explicit so the schema is portable to a
-- fresh Postgres instance.
create extension if not exists pgcrypto;

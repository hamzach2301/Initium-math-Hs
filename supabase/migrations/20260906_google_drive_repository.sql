-- Repository documents now live in Google Drive, not Supabase Storage.
-- Existing files are deliberately not deleted; remove old bucket contents manually after verification.
drop policy if exists "Repository files are publicly readable" on storage.objects;
drop policy if exists "Only admins upload repository files" on storage.objects;
drop policy if exists "Only admins modify repository files" on storage.objects;
drop policy if exists "Only admins delete repository files" on storage.objects;

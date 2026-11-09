# Supabase setup

1. In the Supabase project SQL Editor, run `supabase/migrations/20260902_multi_user.sql` once, then run `supabase/migrations/20260906_student_events.sql`.
2. In **Authentication → URL Configuration**, add the local and production site URLs to the redirect allow list (for example `http://localhost:3000` and your deployed domain).
3. In **Authentication → Providers**, enable Email / Magic Link sign-in.
4. Create a normal user account, then promote only a trusted staff member from the SQL Editor:

   ```sql
   update public.profiles
   set role = 'admin'
   where id = 'the-auth-user-uuid';
   ```

   Do not expose this query, a service-role key, or a role-changing endpoint in the client application.

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is a browser-safe publishable key and remains in `.env.local`, which is ignored by git. This project does not use or require a service-role key.

Repository documents are now served from Google Drive. Replace `fileUrl` values in `lib/repository.ts` with each document's Drive sharing link as files are added; the app converts standard `/view?usp=sharing` links into iframe-safe `/preview` links automatically. Make each document accessible to the intended students in Google Drive.

`20260906_google_drive_repository.sql` removes the old Supabase Storage access policies. It intentionally does not delete existing storage files; remove those manually only after confirming the Drive repository is complete.

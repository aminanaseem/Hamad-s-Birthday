# Hamad's Birthday 🎂

A birthday countdown website from Amina, made for Hamad's birthday on 1 December 2026.

From 16 November, a brand new little website opens every night after 12. Each one has its own design, lock screen, words and photo. On 1 December the big birthday surprise opens, with a Happy Birthday song. From 2 December the site closes by itself.

🔒 **Everything personal is encrypted.** The pages and photos in `vault/` are locked with the website's password. Without the password they are unreadable, and the password is not stored anywhere in this repo.

## For Amina: how to change something
1. Edit the readable files in `private/`. That folder is only on your computer and is never uploaded.
2. Lock them again:
   ```
   $env:BIRTHDAY_PASSWORD="your password"
   python tools/build.py
   ```
3. Commit and push. GitHub publishes the site automatically.

To preview a day locally, run `python -m http.server 5500` and open `http://127.0.0.1:5500/?day=2026-11-24`.

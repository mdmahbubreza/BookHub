# BookHub

Live demo: https://bookhub.app/  •  Sponsor: https://github.com/sponsors/mdmahbubreza

BookHub helps you search, browse, and save books using open data from Open Library. It's simple, privacy-focused, and shows edition-aware ISBNs and cover fallbacks.

Quick Start
-----------

Clone, install, and run:

```bash
git clone <YOUR_GIT_URL>
cd the-wise-shelf-main
npm install
npm run dev
```

Open http://localhost:5173 and try searching by title or author.

Main features
-------------

- Search books by title/author (Open Library)
- Edition-aware ISBNs and cover fallbacks (ISBN → OLID → cover_i)
- Book details modal with notes and bookmarks (stored in Supabase)
- Server-side recommendations via Supabase Edge Functions

Environment
---------------------

Create a `.env` file. Example:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
```

For CI/deploys add securely: `SUPABASE_ACCESS_TOKEN` and, if needed, `SUPABASE_SERVICE_ROLE_KEY`.


Contact
-----------------

Maintainer: `mdmahbubreza` — https://github.com/mdmahbubreza


## Project info

This project uses the Open Library API for book data and recommendations: https://openlibrary.org/developers/api

## How can I edit this code?

You can edit and run this project locally using your preferred IDE.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

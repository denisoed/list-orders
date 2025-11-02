# list-orders

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Environment Variables

The application requires the following environment variables:

### Telegram

- `TELEGRAM_BOT_TOKEN` — Telegram Bot Token obtained from [@BotFather](https://t.me/botfather). This token is used on the server side to validate Telegram Mini App initialization data (initData).

To set up the environment variable, create a `.env` file in the root of the project:

```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

The initData validation happens automatically when the Telegram Mini App initializes. Validation results are logged to the server console.

### Supabase

- `SUPABASE_URL` — Your Supabase project URL (e.g., `https://xxx.supabase.co`). Get it from your [Supabase project settings](https://app.supabase.com/project/_/settings/api).
- `SUPABASE_SECRET` — Service Role Key with full database access. Tokens have format `sb_*`. **WARNING**: This key has admin privileges. Keep it secret and never expose it to client-side code.

Add these variables to your `.env` file:

```bash
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_SECRET=your_sb_secret_token_here
```

**Note**: See `.env.example` for a complete list of required environment variables.

### Using Supabase Client

The Supabase client is available on the server side through the utility function:

```typescript
import { getSupabaseClient } from '~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from('your_table').select('*')
  // ...
})
```

The client is initialized once and reused for all requests (singleton pattern).

## Страницы проектов

- `/projects/new` — форма создания и редактирования проекта. Под полем названия размещается компонент `ProjectInviteLink`,
  отображающий ссылку приглашения коллег с названием проекта и количеством участников.
- `/projects/[id]/team` — страница «Управление командой» с поиском и списком коллег, доступная по ссылке приглашения из формы
  проекта.

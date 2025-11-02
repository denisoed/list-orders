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

- `NUXT_TELEGRAM_BOT_TOKEN` or `TELEGRAM_BOT_TOKEN` — Telegram Bot Token obtained from [@BotFather](https://t.me/botfather). This token is used on the server side to validate Telegram Mini App initialization data (initData).

To set up the environment variable, create a `.env` file in the root of the project:

```bash
NUXT_TELEGRAM_BOT_TOKEN=your_bot_token_here
```

The initData validation happens automatically when the Telegram Mini App initializes. Validation results are logged to the server console.

## Страницы проектов

- `/projects/new` — форма создания и редактирования проекта. Под полем названия размещается компонент `ProjectInviteLink`,
  отображающий ссылку приглашения коллег с названием проекта и количеством участников.
- `/projects/[id]/team` — страница «Управление командой» с поиском и списком коллег, доступная по ссылке приглашения из формы
  проекта.

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

## Создание новой задачи

- Страница создания задачи доступна по адресу `/projects/:id/tasks/new` и открывается из списка задач кнопкой «плюс».
- Форма требует заполнить название и описание, поддерживает загрузку до 5 вложений, выбор исполнителя и дедлайна.
- После успешного сохранения приложение возвращает на страницу списка задач и автоматически отображает новую задачу.

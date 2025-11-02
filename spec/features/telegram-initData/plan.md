# Implementation Plan

**Plan:** На стороне клиента нужно отправлять на сервер telegram initData. На стороне сервера нужно добавить логику валидации initData. Результат выводить в console.log. Используется npm пакет `@telegram-apps/init-data-node`.

## Data sources / schemas

- InitData получается на клиенте из `window.Telegram.WebApp.initData` в виде строки (search parameters format: `query_id=...&user=...&auth_date=...&hash=...`).
- Bot Token для валидации берется из переменных окружения сервера (например, `NUXT_TELEGRAM_BOT_TOKEN` или `TELEGRAM_BOT_TOKEN`).
- Данные передаются через HTTP запрос с телом запроса (POST) или query параметром (GET). Рекомендуется использовать POST для безопасности.
- На сервере initData принимается как строка и передается в функцию `validate` из пакета `@telegram-apps/init-data-node`.
- Не требуется создание специальных схем базы данных или миграций для этой функциональности.

## Contracts and interfaces

- Клиентский composable (расширение `useTelegram` или новый метод): метод `sendInitDataToServer()` или `validateInitData()`, который получает initData и отправляет на сервер.
- Серверный API endpoint: `POST /api/telegram/validate-init-data` (или `/api/validate-init-data`) принимает body с полем `initData: string`.
- Response формат: `{ success: boolean, message?: string }` или простой статус код без body (результат логируется на сервере).
- Интерфейс для обработки ошибок: на клиенте используется try-catch, на сервере ошибки валидации перехватываются и логируются через `console.log`.
- Валидация на сервере использует функцию `validate(initData: string, secretToken: string)` из пакета, которая может выбросить исключения типов: `ERR_AUTH_DATE_INVALID`, `ERR_HASH_INVALID`, `ERR_SIGN_INVALID`, `ERR_EXPIRED`.

## Architecture / Components

- Клиентская часть: расширить существующий composable `useTelegram` в `composables/useTelegram.ts`, добавив метод для получения и отправки initData, или создать отдельный composable `useTelegramInitData` для изоляции логики.
- HTTP клиент: использовать встроенный `$fetch` из Nuxt или `useFetch` для отправки запроса на серверный endpoint.
- Серверная часть: создать файл `server/api/telegram/validate-init-data.post.ts` (или `.get.ts` в зависимости от выбранного метода) в формате Nuxt 3 server route.
- Валидация: установить пакет `@telegram-apps/init-data-node` и импортировать функцию `validate`. Вызвать её с initData и Bot Token из переменных окружения.
- Логирование: использовать `console.log` для вывода результата валидации. Формат лога: `[Telegram InitData Validation] Success/Error: <message>`.
- Обработка ошибок: обернуть вызов `validate` в try-catch блок, логировать тип ошибки через `isErrorOfType` если требуется, или просто выводить сообщение ошибки.
- Инициализация: вызывать отправку initData автоматически после инициализации Telegram WebApp (в плагине `plugins/telegram.client.ts` или в composable при первом обращении).

## Risks

- Если initData недоступен на клиенте (приложение запущено не в Telegram), запрос не должен отправляться или должен обрабатываться корректно на сервере. Митигация: проверка наличия `window.Telegram?.WebApp?.initData` перед отправкой.
- Bot Token может быть скомпрометирован, если логировать полный токен. Митигация: логировать только результат валидации, не логировать сам токен.
- Ошибки валидации могут быть связаны с истечением срока действия initData (1 день по умолчанию). Митигация: логировать тип ошибки для диагностики.
- Пакет `@telegram-apps/init-data-node` может требовать определенную версию Node.js. Митигация: проверить совместимость при установке и использовать последнюю стабильную версию пакета.

## Assumptions

- Bot Token будет предоставлен через переменные окружения и уже настроен для использования с ботом.
- Nuxt 3 поддерживает создание server routes в директории `server/api/` с автоматической регистрацией endpoints.
- Пакет `@telegram-apps/init-data-node` установится без проблем и совместим с текущей версией Node.js.
- Существующий composable `useTelegram` можно расширить без нарушения обратной совместимости, или создание нового composable не вызовет конфликтов.
- Инициализация Telegram WebApp происходит до момента отправки initData, поэтому данные будут доступны.
- Для упрощения, endpoint может не возвращать детальную информацию об ошибке клиенту, только логировать на сервере (если не требуется иное поведение для UX).


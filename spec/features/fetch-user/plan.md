# Implementation Plan

**Plan:** добавить новый серверный api на получение пользователя: user.get. Этот запрос должен срабатывать после validate-init-data.post.ts. На клиенте нужно добавить pinia store куда будет сохраняться полученный пользователь.

## Data sources / schemas

### Структура таблицы users в Supabase

- Таблица `users` уже существует в Supabase и содержит следующие поля:
  - `telegram_id` (bigint, primary key или unique) - уникальный идентификатор пользователя из Telegram
  - `first_name` (text, nullable) - имя пользователя
  - `last_name` (text, nullable) - фамилия пользователя
  - `username` (text, nullable) - username пользователя в Telegram
  - `language_code` (text, nullable) - код языка пользователя
  - `is_premium` (boolean, nullable) - флаг наличия Telegram Premium
  - `photo_url` (text, nullable) - URL фотографии профиля
  - `created_at` (timestamp) - дата создания записи
  - `updated_at` (timestamp) - дата последнего обновления

- Для поиска пользователя используется колонка `telegram_id` с уникальным индексом.

### Тип данных пользователя на клиенте

```typescript
interface User {
  telegram_id: number
  first_name: string | null
  last_name: string | null
  username: string | null
  language_code: string | null
  is_premium: boolean | null
  photo_url: string | null
  created_at: string | null
  updated_at: string | null
}
```

### Миграции базы данных

- Не требуется создание новых миграций, так как таблица `users` уже существует и используется существующим функционалом сохранения пользователя.

## Contracts and interfaces

### Новый серверный API endpoint

- **Endpoint**: `GET /api/user/get`
- **Method**: GET
- **Request Parameters**: 
  - Query параметр `telegram_id` (number, обязательный) - идентификатор пользователя для поиска
  - Или альтернативный вариант: передача `initData` в query параметре для извлечения `telegram_id` на сервере
- **Response Success (200)**:
  ```json
  {
    "user": {
      "telegram_id": 123456789,
      "first_name": "John",
      "last_name": "Doe",
      "username": "johndoe",
      "language_code": "en",
      "is_premium": false,
      "photo_url": "https://...",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  }
  ```
- **Response Error (404)**: Пользователь не найден
  ```json
  {
    "error": "User not found",
    "message": "User with telegram_id 123456789 not found in database"
  }
  ```
- **Response Error (401)**: Отсутствует валидный telegram_id или initData
  ```json
  {
    "error": "Unauthorized",
    "message": "Telegram ID is required or invalid"
  }
  ```
- **Response Error (500)**: Ошибка сервера или базы данных
  ```json
  {
    "error": "Internal server error",
    "message": "Failed to fetch user from database"
  }
  ```

### Интерфейс Pinia store

```typescript
interface UserState {
  user: User | null
  isLoading: boolean
  error: string | null
}

interface UserStore {
  // State
  user: ComputedRef<User | null>
  isLoading: ComputedRef<boolean>
  error: ComputedRef<string | null>
  
  // Actions
  fetchUser(telegramId: number): Promise<void>
  setUser(user: User | null): void
  clearUser(): void
}
```

### Изменения в клиентском коде

- После успешного вызова `POST /api/telegram/validate-init-data` клиент должен автоматически вызывать `GET /api/user/get` с `telegram_id`, извлеченным из `initData`.
- Использование Pinia store в компонентах должно быть опциональным - компоненты могут продолжать работать и без данных пользователя в store.

## Architecture / Components

### Серверная часть

1. **Новый endpoint**: `server/api/user/get.get.ts`
   - Использует `getSupabaseClient()` из `server/utils/supabase.ts` для подключения к базе данных
   - Принимает `telegram_id` в query параметрах
   - Выполняет запрос `SELECT * FROM users WHERE telegram_id = ?`
   - Возвращает данные пользователя или соответствующие ошибки
   - Логирует все операции с префиксом `[User Fetch]`

2. **Валидация параметров**:
   - Проверка наличия `telegram_id` в запросе
   - Проверка, что `telegram_id` является числом
   - Валидация формата данных перед запросом к базе

3. **Обработка ошибок**:
   - Обработка ошибок Supabase (пользователь не найден, ошибка подключения)
   - Возврат соответствующих HTTP статусов
   - Логирование ошибок для отладки

### Клиентская часть

1. **Pinia store**: `stores/user.ts`
   - Определяет состояние пользователя (user, isLoading, error)
   - Предоставляет action `fetchUser(telegramId)` для загрузки данных
   - Предоставляет action `setUser(user)` для установки данных
   - Предоставляет action `clearUser()` для очистки состояния
   - Использует `$fetch` или `useFetch` из Nuxt для запросов к API

2. **Интеграция с validate-init-data**:
   - Обновить `composables/useTelegram.ts` или создать плагин для автоматического вызова `fetchUser` после успешной валидации
   - Извлечение `telegram_id` из `initData` для передачи в `fetchUser`
   - Обработка ошибок при загрузке пользователя

3. **Установка и настройка Pinia**:
   - Проверить наличие Pinia в зависимостях проекта
   - Если отсутствует, добавить `@pinia/nuxt` или `pinia` в зависимости
   - Настроить модуль Pinia в `nuxt.config.ts` если используется модуль
   - Создать директорию `stores/` для хранения store файлов

### Стэк технологий

- **Backend**: Nuxt 3 server API routes, Supabase JS client
- **Frontend**: Vue 3, Pinia, Nuxt 3 composables
- **Database**: Supabase (PostgreSQL)
- **Validation**: TypeScript типы, runtime валидация параметров

## Risks

1. **Риск отсутствия Pinia в проекте**: 
   - **Митигация**: Проверить наличие Pinia перед реализацией, добавить в зависимости при необходимости, настроить модуль в Nuxt config.

2. **Риск проблем с идентификацией пользователя**: 
   - **Митигация**: Реализовать два варианта передачи `telegram_id` - через query параметр и через извлечение из `initData` на сервере. Выбрать наиболее безопасный вариант с учетом архитектуры приложения.

3. **Риск отсутствия пользователя в базе данных**: 
   - **Митигация**: Обработать случай, когда пользователь еще не сохранен в базе (например, если сохранение выполняется асинхронно после валидации). Вернуть понятную ошибку или реализовать механизм ожидания сохранения пользователя.

4. **Риск конфликтов с существующим кодом**: 
   - **Митигация**: Убедиться, что новый endpoint не конфликтует с существующими маршрутами. Проверить, что изменения в `useTelegram` не нарушают существующий функционал.

5. **Риск проблем с типизацией**: 
   - **Митигация**: Использовать единый тип `User` для серверной и клиентской частей, создать общий интерфейс в `server/utils/telegram.ts` или отдельном файле типов.

## Assumptions

- Таблица `users` уже существует в Supabase и содержит необходимые поля для хранения данных пользователя.
- Функционал сохранения пользователя после валидации initData уже реализован и работает корректно.
- `telegram_id` может быть извлечен из `initData` на клиенте после успешной валидации для передачи в запрос `GET /api/user/get`.
- Pinia может быть установлен и настроен в проекте без проблем с совместимостью с существующими зависимостями.
- Nuxt 3 поддерживает создание серверных API endpoints в директории `server/api/` без дополнительной настройки.
- Использование `$fetch` или `useFetch` из Nuxt доступно для выполнения HTTP запросов с клиента.


# Настройка Supabase Function с Cron-запуском

## 1. Минимальный `config.toml`

```toml
project_id = <project-id>

[functions]
```

> ❗️Важно: не добавляйте блок `[project]` или `[cron]`, иначе CLI выдаст ошибку `invalid keys`.

---

## 2. Деплой функции

```bash
npx supabase functions deploy check-overdue-tasks
```

После деплоя функция будет доступна по адресу:

```
https://<project-id>.functions.supabase.co/check-overdue-tasks
```

---

## 3. SQL-запрос для запуска функции по расписанию

```sql
-- Убедись, что pg_cron включён
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Планировщик: каждые 30 минут вызывать edge-функцию check-overdue-tasks
SELECT
  cron.schedule(
    'check_overdue_tasks_every_30min',     -- имя задачи (уникальное)
    '*/30 * * * *',                        -- каждые 30 минут
    $$
      SELECT net.http_post(
        url := 'https://<project-id>.functions.supabase.co/check-overdue-tasks',
        headers := '{"Authorization": "Bearer ' || current_setting('service_role_key') || '"}'
      );
    $$
  );
```

### Проверить активные cron-задачи

```sql
SELECT jobid, schedule, command FROM cron.job;
```

### Удалить cron-задачу

```sql
SELECT cron.unschedule('check_overdue_tasks_every_30min');
```

---

## 4. Советы
- Cron-задачи не поддерживаются на бесплатном плане Supabase.
- Используй Pro-план или Edge Function Scheduler через Dashboard.
- Следи за лимитами: до 8 задач одновременно, каждая ≤ 10 минут.

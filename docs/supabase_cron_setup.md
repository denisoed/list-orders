# Настройка Supabase Function с Cron-запуском

## 1. Минимальный `config.toml`

```toml
project_id = <project-id>

[functions]
```

> ❗️Важно: не добавляйте блок `[project]` или `[cron]`, иначе CLI выдаст ошибку `invalid keys`.

---

## 2. Деплой функций

```bash
# Просроченные задачи
npx supabase functions deploy check-overdue-tasks

# Напоминания о приближающихся сроках
npx supabase functions deploy remind-upcoming-tasks
```

После деплоя функции будут доступны по адресам:

```
https://<project-id>.functions.supabase.co/check-overdue-tasks
https://<project-id>.functions.supabase.co/remind-upcoming-tasks
```

---

## 3. SQL-запросы для запуска функций по расписанию

```sql
-- Убедись, что pg_cron включён
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Просроченные задачи: каждые 30 минут
SELECT
  cron.schedule(
    'check_overdue_tasks_every_30min',
    '*/30 * * * *',
    $$
      SELECT net.http_post(
        url := 'https://<project-id>.functions.supabase.co/check-overdue-tasks',
        headers := '{"Authorization": "Bearer ' || current_setting('service_role_key') || '"}'
      );
    $$
  );

-- Напоминания о сроках: каждые 5 минут
SELECT
  cron.schedule(
    'remind_upcoming_tasks_every_5min',
    '*/5 * * * *',
    $$
      SELECT net.http_post(
        url := 'https://<project-id>.functions.supabase.co/remind-upcoming-tasks',
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

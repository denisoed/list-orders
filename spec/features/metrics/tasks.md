# Tasks

**Context:** Подготовить и внедрить модуль метрик для владельца проектов с использованием данных из Supabase (`projects`, `orders`, `order_history`, `order_reminder_logs`, `project_members`), отобразить ключевые показатели эффективности, сроков, нагрузки, финансов и качества.

## Main directions
### Data & Analytics
- [ ] Разработать SQL-представления/материализованные представления для основных наборов метрик (project, orders, timing, team, finance, quality, reminders) с учётом фильтров по проекту и периоду.
- [ ] Настроить обновление и кеширование представлений (либо через Supabase cron/Edge Function), обеспечить выполнение запросов < 3 сек при объёме до 10k заказов.
- [ ] Подготовить скрипты миграций и документацию по обновлению схемы (описание индексов, требований к данным).

### Backend / API
- [ ] Реализовать серверный эндпоинт `/api/metrics` (или Edge Function) с параметрами `projectId`, `from`, `to`, который агрегирует данные из представлений и возвращает структуру, описанную в плане.
- [ ] Добавить валидацию входных параметров и контроль доступа (проверка `user_telegram_id` владельца, доступ только к своим проектам).
- [ ] Встроить логирование времени выполнения и обработку ошибок с единым форматом ответа.

### Frontend
- [ ] Создать страницу/виджет дашборда метрик с карточками, графиками и таблицами по разделам (прогресс, воронка, сроки, команда, финансы, ревью, напоминания), используя существующие UI-компоненты.
- [ ] Настроить навигацию из вкладки «Метрики» на странице редактирования проекта на новую страницу `/projects/:id/metrics` и обеспечить возврат назад.
- [ ] Реализовать глобальные фильтры периода и проекта, влияющие на все виджеты, и отображать состояния загрузки/ошибок.
- [ ] Покрыть вычисления форматированием (валюта, проценты, локализованные даты) и подсказками по метрикам.

## Supporting tasks
- [ ] Documentation: update relevant instructions and descriptions.
- [ ] Observability: add or clarify metrics, alerts, and/or logging.
- [ ] Code review and PR: prepare changes for review and accompanying information.

## Definition of Done
- [ ] All tasks are completed and tested.
- [ ] Relevant unit/e2e/integration tests pass successfully.
- [ ] Documentation and operational instructions are updated.
- [ ] `/spec/core/verify.md` is executed after completing all tasks to verify the task list.

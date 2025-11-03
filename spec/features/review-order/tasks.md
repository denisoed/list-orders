# Tasks

**Context:** Реализовать страницу отправки заказа на проверку с загрузкой фотографий и комментарием, перенаправляя пользователя с деталей заказа по кнопке «Отметить выполненным», и обеспечить сокращение длинных имен файлов.

## Main directions
### UI/UX
- [ ] Обновить страницу деталей заказа, чтобы кнопка «Отметить выполненным» перенаправляла на маршрут страницы отправки на проверку.
- [ ] Создать страницу отправки на проверку с шапкой (кнопка «Назад» и название задачи), формой загрузки фотографий, полем комментария и кнопкой отправки.
- [ ] Реализовать клиентскую обрезку длинных названий файлов с добавлением троеточия при отображении списка вложений.
- [ ] Убедиться, что интерфейс не содержит лишних элементов и соответствует дизайн-системе проекта.

### Data flow / интеграция
- [ ] Настроить загрузку изображений и передачу их ссылок/идентификаторов вместе с комментарием в бэкенд.
- [ ] Обновить логику смены статуса заказа на «ожидает проверки» после успешной отправки.
- [ ] Обработать ошибки загрузки и отправки, используя существующий механизм уведомлений.

## Supporting tasks
- [ ] Documentation: update relevant instructions and descriptions.
- [ ] Observability: add or clarify metrics, alerts, and/or logging.
- [ ] Code review and PR: prepare changes for review and accompanying information.

## Definition of Done
- [ ] All tasks are completed and tested.
- [ ] Relevant unit/e2e/integration tests pass successfully.
- [ ] Documentation and operational instructions are updated.
- [ ] `/spec/core/verify.md` is executed after completing all tasks to verify the task list.

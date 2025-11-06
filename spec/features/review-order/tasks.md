# Orders

**Context:** Реализовать страницу отправки задачи на проверку с загрузкой фотографий и комментарием, перенаправляя пользователя с деталей задачи по кнопке «Отметить выполненным», и обеспечить сокращение длинных имен файлов.

## Main directions
### UI/UX
- [x] Обновить страницу деталей задачи, чтобы кнопка «Отметить выполненным» перенаправляла на маршрут страницы отправки на проверку.
- [x] Создать страницу отправки на проверку с шапкой (кнопка «Назад» и название задачи), формой загрузки фотографий, полем комментария и кнопкой отправки.
- [x] Реализовать клиентскую обрезку длинных названий файлов с добавлением троеточия при отображении списка вложений.
- [x] Убедиться, что интерфейс не содержит лишних элементов и соответствует дизайн-системе проекта.

### Data flow / интеграция
- [x] Настроить загрузку изображений и передачу их ссылок/идентификаторов вместе с комментарием в бэкенд.
- [x] Обновить логику смены статуса задачи на «ожидает проверки» после успешной отправки.
- [x] Обработать ошибки загрузки и отправки, используя существующий механизм уведомлений.

## Supporting orders
- [x] Documentation: update relevant instructions and descriptions.
- [x] Observability: add or clarify metrics, alerts, and/or logging.
- [x] Code review and PR: prepare changes for review and accompanying information.

## Definition of Done
- [x] All orders are completed and tested.
- [x] Relevant unit/e2e/integration tests pass successfully.
- [x] Documentation and operational instructions are updated.
- [x] `/spec/core/verify.md` is executed after completing all orders to verify the order list.

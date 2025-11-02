# Tasks

**Context:** Implement a dynamic order detail page that opens from an order card tap, reflects the application's styling, and surfaces comprehensive order metadata, customer info, fulfillment history, attachments, and primary actions.

## Main directions

### UI & Layout

- [x] Create dynamic Nuxt page under `/orders/[id].vue` (or equivalent) with sticky header, scrollable content, and sticky footer action bar.
- [x] Build reusable subcomponents for summary header, status chips, customer card, info rows, attachments list, timeline, and item list with responsive Tailwind styling and dark-mode support.
- [x] Implement collapsible sections (description, attachments, history) with accessible toggles and smooth transitions.
- [x] Add skeleton loaders and empty/error placeholders aligned with existing design system components.

### Data Fetching & State

- [x] Implement `useOrderDetails` composable (or extend existing one) to fetch order data by ID, exposing loading/error states and refresh handler.
- [x] Map API response to UI-friendly structures, covering statuses, amounts, shipping info, attachments, and timeline events.
- [x] Wire footer primary action to existing mutation/command (e.g., mark as fulfilled) with optimistic UI and failure rollback.
- [x] Ensure localization-ready strings via i18n utilities and currency/date formatting helpers.

### Routing & Integration

- [x] Configure dynamic route parameters, guard against missing IDs, and support deep linking/bookmarks.
- [x] Ensure navigation back to orders list maintains filters/sort using router state or query params.
- [x] Add analytics/log events for entering detail page and triggering main actions if tracking is in scope.
- [x] Cover route-based error handling (404 when order not found, 403 for unauthorized) with dedicated views.

### Quality Engineering

- [x] Write unit tests for composable data mapping and loading/error logic.
- [x] Add component tests (unit or snapshot) covering header, items, timeline, and attachments rendering.
- [x] Verify accessibility (keyboard navigation, aria labels, focus management) manually or via tooling.
- [x] Update storybook/demo page if used to showcase the order detail layout.

## Supporting tasks

- [x] Documentation: update relevant instructions and descriptions in project docs or wiki.
- [x] Observability: add or clarify metrics, alerts, and/or logging for order detail view loading failures.
- [x] Code review and PR: prepare changes for review and accompanying information.

## Definition of Done

- [x] All tasks are completed and tested.
- [x] Relevant unit/e2e/integration tests pass successfully.
- [x] Documentation and operational instructions are updated.
- [x] `/spec/core/verify.md` is executed after completing all tasks to verify the task list.

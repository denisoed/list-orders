# Implementation Plan

**Plan:** Build a project-scoped "Create Order" page reached from the orders list, implement form UI and validation that mirrors the provided mockup, integrate with order data sources, and ensure smooth navigation back to the orders list.

## Data sources / schemas

- Reuse existing project/order composables; extend them with a `createOrder` method that accepts `{ projectId, title, description, attachments, link, assigneeId, deadline }`.
- Define a temporary local schema/interface for new order payload if backend contract is pending; ensure mapping to API once available.
- Store attachments client-side until upload integration is ready; prepare data structure for `{ id, name, previewUrl }` entries to keep UI responsive.

## Contracts and interfaces

- Expose a new navigation route `/projects/[id]/orders/new` in Nuxt pages; ensure router pushes handle `projectId` parameter.
- Create a form component that emits submit and cancel events; connect to plus button handler via router push and to close icon via router.back or named route navigation.
- Validate inputs on submit: title required, optional URL validated via regex/URL constructor, attachments limited by available component rules.
- Interface with `useProjectOrders` or a new composable method to refresh the order list after successful creation.

## Architecture / Components

- Add a new page component `pages/projects/[id]/orders/new.vue` implementing the layout (header, form sections, footer submit).
- Create or reuse shared UI components for attachment tiles, file upload, and selection controls; if missing, implement minimal inline components scoped to this page with Tailwind styling.
- Use existing Tailwind config, fonts, and Material Symbols setup; ensure `useHead` in new page mirrors orders page for consistency.
- Manage form state with `ref`/`reactive` data; handle disabled state and loading indicator on submit button.
- Ensure responsive layout by using flex/spacing utilities and wrapping sections in scrollable container with bottom padding for the fixed footer.

## Risks

- Backend contract for order creation might be undefined, risking rework; mitigate by encapsulating API in composable with clear TODOs.
- Attachment upload may require additional dependencies (drag-and-drop, preview generation); mitigate by planning incremental implementation with placeholders.
- Navigation might lose project context if route params missing; mitigate with guard that redirects back when `projectId` invalid.

## Assumptions

- Existing project data can be reused to show context in the header; no additional API calls needed for page load beyond already cached project info.
- Design assets (icons, colors) follow existing tokens, so no new Tailwind config is necessary.
- Localization remains Russian; texts such as "Новая задача", "Создать задачу" will be used unless a translation layer is introduced.

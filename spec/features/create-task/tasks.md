# Orders

**Context:** Implement a project-scoped "Create Order" page that opens from the "+" button on the orders list and matches the provided dark theme design, including form fields, attachments UI, validation, and navigation back to the project orders view after submission.

## Main directions

### Routing and navigation
- [x] Add Nuxt page `pages/projects/[id]/orders/new.vue` and configure route metadata/head to align with existing orders pages.
- [x] Update the "+" button handler on the project orders page to push to the new creation route with the active `projectId`.
- [x] Implement cancel/close logic that returns users to `/projects/[id]/orders` preserving filters when possible.

### Form experience and validation
- [x] Build the creation form replicating the provided layout with sections for title, description, attachments, link, assignee, and deadline.
- [x] Implement reactive form state with required title validation, optional URL validation, and disabled submit button until validation passes.
- [x] Provide visual feedback for loading/submission and ensure keyboard accessibility for all controls.

### Data integration
- [x] Extend or create a composable method (e.g., `createOrder`) that sends the new order payload (title, description, attachments, link, assignee, deadline) to the backend or stub service.
- [x] After successful creation, trigger a refresh of the project orders list (reuse `useProjectOrders`) and navigate back to the list view.
- [x] Handle attachment previews and removal, stubbing upload operations if the backend is not yet integrated.

## Supporting orders

- [x] Documentation: update relevant instructions and descriptions.
- [x] Observability: add or clarify metrics, alerts, and/or logging.
- [x] Code review and PR: prepare changes for review and accompanying information.

## Definition of Done

- [x] All orders are completed and tested.
- [x] Relevant unit/e2e/integration tests pass successfully.
- [x] Documentation and operational instructions are updated.
- [x] `/spec/core/verify.md` is executed after completing all orders to verify the order list.

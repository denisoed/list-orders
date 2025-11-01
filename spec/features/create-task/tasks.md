# Tasks

**Context:** Implement a project-scoped "Create Task" page that opens from the "+" button on the tasks list and matches the provided dark theme design, including form fields, attachments UI, validation, and navigation back to the project tasks view after submission.

## Main directions

### Routing and navigation
- [ ] Add Nuxt page `pages/projects/[id]/tasks/new.vue` and configure route metadata/head to align with existing tasks pages.
- [ ] Update the "+" button handler on the project tasks page to push to the new creation route with the active `projectId`.
- [ ] Implement cancel/close logic that returns users to `/projects/[id]/tasks` preserving filters when possible.

### Form experience and validation
- [ ] Build the creation form replicating the provided layout with sections for title, description, attachments, link, assignee, and deadline.
- [ ] Implement reactive form state with required title validation, optional URL validation, and disabled submit button until validation passes.
- [ ] Provide visual feedback for loading/submission and ensure keyboard accessibility for all controls.

### Data integration
- [ ] Extend or create a composable method (e.g., `createTask`) that sends the new task payload (title, description, attachments, link, assignee, deadline) to the backend or stub service.
- [ ] After successful creation, trigger a refresh of the project tasks list (reuse `useProjectTasks`) and navigate back to the list view.
- [ ] Handle attachment previews and removal, stubbing upload operations if the backend is not yet integrated.

## Supporting tasks

- [ ] Documentation: update relevant instructions and descriptions.
- [ ] Observability: add or clarify metrics, alerts, and/or logging.
- [ ] Code review and PR: prepare changes for review and accompanying information.

## Definition of Done

- [ ] All tasks are completed and tested.
- [ ] Relevant unit/e2e/integration tests pass successfully.
- [ ] Documentation and operational instructions are updated.
- [ ] `/spec/core/verify.md` is executed after completing all tasks to verify the task list.

# Tasks

**Context:** Deliver a New Task page accessible from the task list plus button, matching the provided dark-theme UI, enabling task data entry, validation, and submission.

## Main directions

### UI and navigation

- [ ] Add a dedicated route/page (e.g., `pages/tasks/new.vue`) with layout per mockup: sticky header, scrollable content, fixed footer.
- [ ] Wire the plus button on the task list to navigate to the new route, preserving return navigation and unsaved state handling.
- [ ] Implement close/back controls that confirm when leaving with unsaved changes and return to the originating page.

### Form and interactions

- [ ] Build form sections for title, description, attachments, link, assignee, and deadline with responsive Tailwind styling.
- [ ] Implement validation rules: required title/description, URL pattern for link, attachment limits, enabling the Create button only when valid.
- [ ] Add attachment management (add/remove previews) and integrate placeholder selectors for assignee and deadline.
- [ ] Handle loading/submission states with disabled button and success/error feedback.

### Data integration

- [ ] Extend or create a task composable/service exposing `createTask` to submit the form payload and handle API errors.
- [ ] Map form state to the expected backend payload, including attachments metadata and optional fields.
- [ ] After successful creation, refresh or update the task list and navigate back or display confirmation.

## Supporting tasks

- [ ] Documentation: update relevant instructions and descriptions.
- [ ] Observability: add or clarify metrics, alerts, and/or logging.
- [ ] Code review and PR: prepare changes for review and accompanying information.

## Definition of Done

- [ ] All tasks are completed and tested.
- [ ] Relevant unit/e2e/integration tests pass successfully.
- [ ] Documentation and operational instructions are updated.
- [ ] `/spec/core/verify.md` is executed after completing all tasks to verify the task list.

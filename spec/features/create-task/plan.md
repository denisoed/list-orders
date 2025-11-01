# Implementation Plan

**Plan:** Build the New Task page triggered from the task list plus button, following the provided UI layout, adding form state management, validation, and integration hooks for assignee, deadline, attachments, and submission.

## Data sources / schemas

- Define a task creation payload containing `title`, `description`, `attachments`, `link`, `assigneeId`, and `dueDate`. Align field names with existing task list data structures once confirmed.
- If backend integration exists, configure a composable/service (e.g., `useTasks`) to expose a `createTask` mutation; otherwise, provide a mock implementation behind a feature flag for UI testing.
- Use an attachment model with temporary IDs, file name, preview URL, and upload status. Determine storage limits (count, size) and enforce client-side checks.
- Ensure date handling uses ISO strings or project-standard formats; rely on dayjs/date-fns utilities already in the repo if available.

## Contracts and interfaces

- Add a named route for the New Task page (e.g., `/tasks/new`), ensuring the plus button navigates via router push.
- Expose form components with clear props/events: attachment uploader emits `add` and `remove` events, assignee/deadline selectors emit selected value objects.
- Implement validation states using composables or vee-validate/yup if already present; otherwise, use simple reactive rules returning error strings.
- On submission, call `createTask` and handle success (navigate back + optional notification) and failure (display error, maintain form state).
- Provide navigation guards (route leave hook) that prompt the user when unsaved changes exist.

## Architecture / Components

- Create `pages/tasks/new.vue` (or appropriate path) with layout matching the mockup: sticky header, scrollable main section, fixed footer.
- Leverage Tailwind classes for styling, referencing tokens (`bg-background-dark`, `text-primary`, etc.). Ensure dark/light class support through existing layout wrappers.
- Implement reusable subcomponents if necessary: `TaskAttachmentsInput`, `AssigneeSelectorTrigger`, `DeadlineSelectorTrigger` to keep `new.vue` concise.
- Utilize existing button/input components if the project has them; otherwise, create local styled elements consistent with design system.
- Integrate with `useHead`/`definePageMeta` for title and transitions consistent with current Nuxt setup.
- Implement loading/disabled states with `useAsyncState` or standard `ref` booleans.

## Risks

- Unclear backend API for task creation may block full integration; mitigate by scaffolding with mocks and feature flagging submission.
- Attachment upload complexity (file storage, preview) may exceed current scope; mitigate by limiting to image previews and deferring upload integration after confirmation.
- Assignee/deadline selectors may require additional pages or components; mitigate by starting with placeholder dialogs and iterating once requirements are clarified.
- Validation complexity (especially URL validation and multi-field dependencies) could grow; mitigate with a lightweight validation utility shared across fields.

## Assumptions

- Existing task list page resides under `/pages` and already uses router navigation, making it straightforward to add a new route.
- Design tokens (colors, spacing) exist in Tailwind config and can be reused without new theme setup.
- Global state management (Pinia/composables) can accommodate a new create mutation without major refactoring.
- Any analytics or tracking for task creation will be handled separately and do not influence initial implementation.

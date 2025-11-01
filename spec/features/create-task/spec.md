# Create Task Page

**Specification:** Implement a dedicated page for creating a new task within a project. The page must open when the user taps the floating "+" button on the project tasks screen and reproduce the dark theme layout from the provided design, including inputs for task metadata, attachments, assignee, and deadline.

## User Stories

- As a project manager viewing project tasks, I want to open a "New Task" screen from the "+" button so that I can add work items without leaving the project context.
- As a user filling the form, I want clearly labeled inputs for title, description, link, attachments, assignee, and deadline so that I provide all required task details in one place.
- As a user preparing the task, I want a disabled submit button until the minimum required data is entered so that I avoid sending incomplete tasks by mistake.

## Main scenarios and rules

- When the user clicks the floating "+" button on `/projects/[id]/tasks`, they are navigated to the new task creation route for the same project (e.g., `/projects/{id}/tasks/new`).
- The new page displays the provided dark theme layout: header with close control, title "New Task", and a footer button labeled "Create Task" styled as in the mockup.
- Required inputs: Task Title (single-line, required), Task Description (multiline), Link (URL format but optional), attachment picker (with empty state tile and preview thumbnails), assignee selector, deadline picker.
- Attachments section must support showing already selected assets as thumbnails with remove controls and an add-tile for uploading. For now, reuse existing stub data/hooks if storage is not implemented.
- Close action returns the user to the originating tasks page without creating a task.
- Submission triggers client-side validation (e.g., title required, link must be a valid URL when provided) and disables the submit button while processing.
- After successful creation, navigate back to the tasks list and refresh task data (via existing composables or placeholder logic if backend not ready).

## Non-functional requirements

- UI must respect existing Tailwind setup, dark mode defaults, and typography consistent with the rest of the project.
- Form controls need accessible labels, focus states, and keyboard navigation compliance.
- Ensure the page works on small screens (mobile-first) and handles long descriptions via scrollable content.
- Loading/submit states should provide visual feedback; no blocking navigation during async operations.

## Assumptions

- Task creation API or composable exists or can be stubbed; otherwise, a placeholder implementation will be coordinated later.
- Attachment upload implementation may reuse existing upload utilities; if unavailable, mock interactions with clear TODO notes.
- Localization remains Russian for UI texts unless global translation framework is introduced.
- Navigation stack supports programmatic routing between task list and creation page.

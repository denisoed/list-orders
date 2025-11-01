# Create Task Page

**Specification:** Implement a dedicated "New Task" page that opens from the task list when users click the plus button. The page must follow the provided dark-theme layout, allow entering core task metadata (title, description, link), manage attachments, and pick an assignee and deadline before submitting the task. The form should validate inputs, enable task creation only when required fields are filled, and integrate with existing navigation and data flow.

## User Stories

1. **As a project manager, I want to open the New Task page from the task list, so I can quickly start drafting a task without leaving the current project context.**
2. **As a task creator, I want to fill in title, description, attachments, optional link, assignee, and deadline, so the created task contains all necessary information for execution.**
3. **As a collaborator, I want form validation and feedback before submission, so I avoid saving incomplete or invalid tasks.**
4. **As a mobile user, I want the New Task page layout to adapt to smaller screens, so I can create tasks on the go.**

## Main scenarios and rules

- Clicking the plus button on the task list page routes to the New Task page with a full-screen dark theme layout, sticky header, and footer as shown in the reference mockup.
- The header contains a close button that navigates back to the task list without persisting changes, and the title "New Task" centered.
- The form includes inputs for Task Title (required), Task Description (required), Attachments (preview existing files, add new, remove existing), Link (optional URL), Assignee (navigates to selector modal/list), and Deadline (opens date picker or navigation to selection UI).
- The Create Task button is disabled until required fields are valid; it triggers task creation and returns to the task list (or confirmation) on success.
- Form fields must provide validation messaging for missing required information and invalid URL format for the link field.
- Attachment slot must support at least one preview item with remove action and a control to add additional files or images.
- The page supports both dark and light themes aligned with the project’s Tailwind design tokens; spacing, typography, and component states match the reference.
- Loading or submission state should provide feedback (e.g., button spinner or disabled state) and prevent duplicate submissions.
- Handle navigation guards (confirm exit) if the user has unsaved changes and attempts to close/back.

## Non-functional requirements

- Respect existing Tailwind configuration, design tokens, and component conventions for consistency.
- Responsive layout supporting mobile (min-width 320px) up to desktop with appropriate spacing adjustments.
- Accessibility: semantic form elements, focus management, keyboard navigation, and descriptive labels for icons/buttons.
- Performance: avoid unnecessary re-renders, load assignee/deadline selectors efficiently, and lazy-load heavy assets (e.g., attachment previews) if needed.
- Localization readiness: texts should be sourced from translation utilities if the project uses i18n.
- Ensure compatibility with current routing (Nuxt) and state management patterns without introducing blocking dependencies.

## Assumptions

- The plus button on the task list triggers navigation via a named route or programmatic router push that can be updated to point to the new page.
- Task creation will integrate with an existing API or temporary mock service; specifics (endpoint, payload) require clarification from backend specs.
- Attachment upload handling (storage, size limits, file types) will leverage existing upload components/services or needs definition—awaiting confirmation.
- Assignee and deadline pickers may reuse existing components; if none exist, lightweight placeholder interactions will be implemented pending future integration.
- Success navigation after creation returns to the originating task list; any toast/notification requirements need confirmation.

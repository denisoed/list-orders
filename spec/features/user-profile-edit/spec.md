# User profile edit

**Specification:** Create a dedicated page for authenticated users to view and edit their profile data. The page must open after clicking the avatar in the header on the main page, reuse the existing user store as the single source of truth, and provide an intuitive form aligned with shared UI styles.

## User Stories

1. **As an authenticated user,** I want to click my avatar in the main page header and land on my profile page **so that** I can quickly access my personal settings.
2. **As an authenticated user,** I want the profile form to show my current information from the user store **so that** I can review and adjust my details without re-entering everything.
3. **As an authenticated user,** I want to edit my profile fields (name, username, language) and submit updates **so that** my personal data stays accurate across the application.

## Main scenarios and rules

- Clicking the avatar in the global header on the main page must route to the new profile edit page.
- The profile page consumes user data exclusively through the Pinia user store; it must react to store updates and loading states.
- Form fields should cover editable attributes: first name, last name, username, language code, premium status (read-only toggle), and avatar preview when available.
- Form must include validation for required fields (e.g., first name) and provide inline error messaging that matches existing UI patterns.
- Saving should trigger the appropriate action (placeholder if backend is missing) and provide user feedback (success or error states).
- If the user store lacks data (e.g., not loaded), display a loading indicator or prompt to retry fetching.
- Navigation breadcrumbs or back link should allow returning to the main page.

## Non-functional requirements

- Follow existing design system: shared components, spacing, typography, and responsive layout for desktop and mobile.
- Ensure accessibility: labelled fields, proper focus states, keyboard navigation, and readable contrast.
- Keep performance lightweight by minimizing unnecessary re-renders and using store-computed data.
- Provide localization-ready strings by using existing i18n approach if available; otherwise centralize text for future translation.

## Assumptions

- Avatar click event in the header can be extended to navigate to `/profile/edit` without conflicting routes.
- Backend endpoints for saving profile data may be stubbed; integration details will be clarified later.
- User authentication and store population are handled before the profile page mounts.
- Additional profile attributes (email, phone) are out of scope unless provided by the store.

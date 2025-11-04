# Orders

**Context:** Implement a profile editing experience that opens from the avatar in the main header, reads data from the Pinia user store, and provides an editable form for authenticated users.

## Main directions

### UI & Navigation
- [x] Add a new page component at `pages/profile/edit.vue` with a responsive layout following shared styles.
- [x] Update the header avatar component to navigate to `/profile/edit` when clicked, preserving existing interactions.
- [x] Ensure the page includes navigation breadcrumbs or a back action to return to the main page.

### State management & Logic
- [x] Connect the profile edit page to `useUserStore`, handling loading, empty, and error states gracefully.
- [x] Implement form state for editable fields and validation rules consistent with existing patterns.
- [x] Create or stub a store action for saving profile updates, including optimistic UI feedback.

### UX Feedback & Accessibility
- [x] Display success and error messages using shared notification components or inline alerts.
- [x] Provide accessible labels, focus management, and keyboard navigation for all form controls.
- [x] Add read-only indicators for non-editable data such as premium status and avatar preview.

## Supporting orders

- [x] Documentation: update relevant instructions and descriptions.
- [x] Observability: add or clarify metrics, alerts, and/or logging.
- [x] Code review and PR: prepare changes for review and accompanying information.

## Definition of Done

- [x] All orders are completed and tested.
- [x] Relevant unit/e2e/integration tests pass successfully.
- [x] Documentation and operational instructions are updated.
- [x] `/spec/core/verify.md` is executed after completing all orders to verify the order list.

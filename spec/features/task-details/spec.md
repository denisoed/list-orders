# Order Detail Page

**Specification:** Develop a dynamic order detail page that opens when a user taps an order card. The screen must adopt the application's existing visual language while presenting comprehensive order metadata, fulfillment progress, customer info, line items, attachments, and contextual actions.

## User Stories

1. **As a store manager**, I want to open an order card and land on a detail page so that I can inspect payment status, fulfillment progress, and delivery expectations.
2. **As a support agent**, I want to see the customer profile, contact actions, and timeline updates so that I can respond quickly to inquiries.
3. **As a warehouse operator**, I want to review ordered items, quantities, and picking notes so that I can prepare shipments without leaving the page.
4. **As a business analyst**, I want export or attachment downloads accessible from the detail view so that I can audit order documentation.

## Main scenarios and rules

- Access the detail page through navigation (card tap or direct link) while keeping route parameters for dynamic order IDs.
- Display essential order summary (order number, status, creation date, total, badges for alerts) in a sticky header.
- Present customer segment with avatar initials, contact buttons, and loyalty tier; clicking contact actions should open the default mail/phone handlers.
- Provide sections for shipping details, payment info, list of items, fulfillment timeline, and notes; each section collapsible if long.
- Handle loading and error states: skeleton loader during fetch, actionable empty states when data missing, and retry for network errors.
- Keep CTA footer for primary action (e.g., "Mark as fulfilled") with state-aware enablement and confirmation handling.
- Ensure dark mode styles follow existing tokens and spacing conventions of the app.

## Non-functional requirements

- Reuse existing API client/composables for fetching order data; avoid duplicating data-fetch logic.
- Support responsive breakpoints for desktop, tablet, and mobile with consistent spacing and typography.
- Page should load visible content within 1.5s on broadband by minimizing blocking assets and using incremental rendering.
- Maintain accessibility: semantic headings, focus order, keyboard navigation, and color contrast ≥ WCAG AA.
- Localization-ready strings via existing i18n utilities.

## Assumptions

- There is an existing endpoint that returns full order details (customer info, items, attachments, history) by order ID.
- Route structure will be `/orders/[id]` or similar and router configuration already supports dynamic segments.
- Design tokens, typography, and icon set are already available in the project for reuse.
- Attachment download URLs are returned directly by the API without requiring additional signing flows.
- No requirement yet for inline editing on this page; interactions are view-only except for top-level actions.

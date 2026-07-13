<!-- BEGIN:nextjs-agent-rules -->
# Multi-Version E-Commerce Platform Implementation Guide

This project is a multi-version e-commerce platform (not a multi-tenant project). It is designed to customize storefronts for different clients by selecting and combining specific versions of UI components (such as Navbar V1-V6, Footer V1-V6, and Product Card V1-V6).

## 1. Project Architecture
- **Component Versioning:** The platform supports multiple versions (V1 to V6) of core UI components:
  - **Navbars:** V1 - V6
  - **Footers:** V1 - V6
  - **Product Cards:** V1 - V6
- **Client Selection:** Each client uses a specific version of these components to customize their storefront.
- **Registry Pattern:** Variations are registered and selected dynamically. Always follow the established registration pattern when adding or modifying component versions.

## 2. Visual Identity & Styling
- **Dynamic Themes:** Always use CSS variables (defined in `src/app/theme.css`) for branding and styling. Do not hardcode hex codes or color names directly.
- **Strict Dynamic Theming & Typography:** No hardcoded static color classes (e.g., `bg-emerald-950`, `text-emerald-400`) or hardcoded fonts may be used in layout templates or component screens. All custom components and pages must reference theme-relative classes or variables (e.g. `bg-primary`, `text-primary-foreground`, `font-body`) tied to `src/app/theme.css` so that the theme palette and body/logo typography can be changed dynamically by the super_admin from the System Design configuration panel.
- **Aesthetic Quality:** Maintain high-quality visual standards across all versions of the components.

## 3. Technical Stack & Tools
- **Framework:** Next.js.
- **Styling:** Tailwind CSS.
- **UI Components:** shadcn/ui.
- **Toasts:** Use **shadcn/ui Sonner** (sonner) for toast notifications.
- **Alerts:** Use **SweetAlert2** for all administrative confirmations and success/error notifications. Avoid native browser `alert()` or `confirm()`.
- **Icons:** Use `lucide-react`.
- **Database:** MongoDB.

## 4. System Design Page Constraints
- **Preserve Functionality:** All existing functionalities of the System Design page (`/admin/system-design`) must remain completely unchanged and preserved in future updates.
- **Auto Super Admin Rule:** The email address `imranshuvo101@gmail.com` must be automatically registered/configured as `super_admin` in the system, and this rule/configuration must never be modified or removed.
- **Admin Assignment Workflow:** Only the `super_admin` is permitted to assign the `admin` role to users using only their email address from the user management page. This functionality must be preserved.
- **Project Expiration Setting:** The `super_admin` must be able to set the project's expiration date from the System Design page (`/admin/system-design`), and this functionality must remain fully functional.
<!-- END:nextjs-agent-rules -->

# AI Rules for TuBarrio Application Development

This document outlines the technical stack and specific guidelines for using libraries within the TuBarrio application. Adhering to these rules ensures consistency, maintainability, and efficient development.

## Tech Stack Overview

The TuBarrio application is built using a modern web development stack, focusing on performance and developer experience:

*   **React**: The core JavaScript library for building user interfaces.
*   **TypeScript**: A superset of JavaScript that adds static typing, enhancing code quality and developer tooling.
*   **Tailwind CSS**: A utility-first CSS framework for rapidly building custom designs directly in your markup.
*   **React Router**: Used for declarative routing within the application, managing navigation and URL synchronization.
*   **Lucide React**: A collection of beautiful and customizable open-source icons, integrated as React components.
*   **Shadcn/ui**: A collection of reusable components built with Radix UI and Tailwind CSS, providing accessible and customizable UI elements.
*   **Vite**: A fast build tool that provides an extremely quick development server and bundles your code for production.
*   **Mock Service**: An in-memory service (`services/mockService.ts`) simulating backend API calls for development and demonstration purposes.

## Library Usage Rules

To maintain a consistent and efficient codebase, please follow these guidelines when developing or modifying the application:

*   **UI Components**:
    *   **Prioritize Shadcn/ui**: Always try to use components from `shadcn/ui` first for common UI elements (e.g., buttons, forms, cards, dialogs). These components are pre-styled with Tailwind CSS and are accessible.
    *   **Custom Components**: If a required component is not available in `shadcn/ui` or needs significant custom behavior, create a new, dedicated component file in `src/components/`. Do not modify `shadcn/ui` source files directly.
*   **Styling**:
    *   **Tailwind CSS Only**: All styling must be done using Tailwind CSS utility classes. Avoid writing custom CSS files (`.css`, `.scss`) or using inline style objects in JSX, unless absolutely necessary for dynamic, calculated styles.
    *   **Responsive Design**: Always ensure designs are responsive using Tailwind's responsive utility variants (e.g., `sm:`, `md:`, `lg:`).
*   **Icons**:
    *   **Lucide React**: Use icons exclusively from the `lucide-react` library. Import them as React components (e.g., `<MapPin size={16} />`).
*   **Routing**:
    *   **React Router**: All client-side navigation and routing must be handled by `react-router-dom`.
    *   **Route Definition**: Keep the main application routes defined in `src/App.tsx`.
*   **State Management**:
    *   **React Hooks**: For component-local state, use React's `useState` and `useEffect` hooks.
    *   **Context API**: For global state that needs to be shared across many components, consider using React's Context API, but keep implementations simple and focused.
*   **Data Interaction**:
    *   **Mock Service**: Currently, `services/mockService.ts` handles all data operations. When integrating with a real backend (e.g., Supabase), this service should be replaced or adapted to interact with the actual API.
*   **File Structure**:
    *   **Pages**: Top-level views should reside in `src/pages/`.
    *   **Components**: Reusable UI elements should be placed in `src/components/`.
    *   **Services**: API interaction logic and data fetching utilities belong in `src/services/`.
    *   **Constants**: Application-wide constants should be in `src/constants/`.
    *   **Utilities**: Generic helper functions should be in `src/utils/`.
    *   **Naming Conventions**: Directory names must be all lowercase. File names may use mixed-case (e.g., `ReportCard.tsx`).
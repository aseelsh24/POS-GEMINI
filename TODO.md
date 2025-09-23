# Security Checklist & Future Improvements

This document outlines the current security posture of the application and lists potential features and improvements for future versions.

## Security Checklist

-   **[✓] User Authentication:** A local authentication system is in place. Access to the application requires a valid username and PIN.
-   **[✓] PIN Hashing:** All user PINs are hashed using the strong SHA-256 algorithm before being stored in the IndexedDB. No plain-text credentials are ever stored.
-   **[✓] Role-Based Access Control (RBAC):** A basic RBAC system is implemented. Navigation buttons for sensitive sections (e.g., Reports, Backup) are hidden from users with insufficient privileges (e.g., 'Cashier').
-   **[✓] Client-Side Data:** All data is stored locally on the user's device in IndexedDB. There is no server component, which eliminates a large class of remote vulnerabilities.
-   **[~] Cross-Site Scripting (XSS):** Currently, all dynamic data is rendered as text content (`.textContent`) or input values (`.value`), which prevents XSS vulnerabilities. **TODO:** If future features render user-supplied data as HTML (e.g., using `.innerHTML`), proper sanitization will be required to prevent XSS attacks.
-   **[~] Data-in-Transit:** Not applicable as there is no server communication for core features. All data remains on the client.

## TODOs & Future Improvements

### High Priority
-   **User Management UI:** Build a dedicated UI for the 'Owner' role to add, edit, and delete users and change their roles and PINs. This is a critical feature for managing a team.
-   **Advanced Inventory Costing:** Implement the FIFO (First-In, First-Out) inventory evaluation method as an option in the settings, as suggested in the original plan. This would require significant changes to the `purchases` and `sales` logic to track cost layers.
-   **Detailed Purchase/Sale History:** Create views to see historical purchase invoices and sales receipts, with the ability to view the details of each transaction.

### Medium Priority
-   **Dashboard:** Create a main dashboard view that shows key performance indicators (KPIs) at a glance, such as today's sales, low-stock item count, and outstanding customer balances.
-   **More Detailed Reports:** Expand the reporting module to include:
    -   Best-selling products by category.
    -   Sales by cashier.
    -   Supplier-specific purchase history.
-   **Cash Drawer Management:** Add a feature to track cash-in/cash-out operations for a physical cash drawer.

### Low Priority / Polish
-   **UI/UX Enhancements:**
    -   Implement more sophisticated modals instead of using the browser's `alert()` and `confirm()`.
    -   Add pagination to long tables (e.g., products, sales history).
    -   Add a dark mode theme.
-   **ESC/POS Printing:** Investigate and implement the optional Node.js print server for direct printing to thermal receipt printers for a more professional POS experience.
-   **Data Validation:** While basic HTML5 validation is in place, add more robust JavaScript-based validation for more complex rules and better user feedback.

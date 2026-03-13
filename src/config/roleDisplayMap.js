/**
 * Maps internal role codes to Arabic display names.
 * Used across the UI to show human-readable role names.
 */
export const ROLE_DISPLAY = {
    Admin: 'مدير النظام',
    HRManager: 'مدير الموارد البشرية',
    HR: 'موارد بشرية',
    Manager: 'مدير',
    Employee: 'موظف'
};

/**
 * Get Arabic display name for a role.
 * Falls back to the raw role string if not found.
 */
export const getRoleDisplayName = (role) => ROLE_DISPLAY[role] || role;

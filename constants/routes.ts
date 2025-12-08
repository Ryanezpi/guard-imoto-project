export const ROUTES = {
  ROOT: '/',

  // ───────────────────────────────
  // ONBOARDING FLOW
  // ───────────────────────────────
  ONBOARDING: {
    ROOT: '/(onboarding)',
    WALKTHROUGH: '/(onboarding)/walkthrough',
    PERMISSIONS: '/(onboarding)/permissions',
  },

  // ───────────────────────────────
  // AUTH FLOW
  // ───────────────────────────────
  AUTH: {
    ROOT: '/(auth)',
    LOGIN: '/(auth)/login',
    FORGOT_PASSWORD: '/(auth)/forgot-password',

    CREATE_ACCOUNT: {
      ROOT: '/(auth)/create-account',
      USER_DETAILS: '/(auth)/create-account/user-details',
      PASSWORD: '/(auth)/create-account/password',
      PHONE_VERIFICATION: '/(auth)/create-account/phone-verification',
    },
  },

  // ───────────────────────────────
  // APP FLOW
  // ───────────────────────────────
  APP: {
    ROOT: '/(app)', // App root
    MAP: '/(app)/map', // Map screen
    ALERTS: '/(app)/alerts', // Alerts list
    ALERT_DETAIL: '/(app)/alerts/[id]', // Dynamic alert detail
    SETTINGS: '/(app)/settings', // Settings screen
  },

  PROFILE: {
    ROOT: '/(app)/profile',
    INDEX: '/(app)/profile/index', // Profile main screen
    DEVICES: '/(app)/profile/devices',
    EDIT: '/(app)/profile/edit',
    NOTIFICATIONS: '/(app)/profile/notifications',
    HELP: '/(app)/profile/help',
    SECURITY: '/(app)/profile/security',
    HISTORY: '/(app)/profile/history', // Profile history
  },
} as const;

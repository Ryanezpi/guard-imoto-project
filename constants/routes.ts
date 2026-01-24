export const ROUTES = {
  ROOT: '/',

  // ───────────────────────────────
  // ONBOARDING FLOW
  // ───────────────────────────────
  ONBOARDING: {
    ROOT: '/(onboarding)',
    WALKTHROUGH: '/(onboarding)/walkthrough',
    PERMISSIONS: '/(onboarding)/permissions',
    PRIVACY_POLICY: '/(onboarding)/privacy-policy',
  },

  // ───────────────────────────────
  // AUTH FLOW
  // ───────────────────────────────
  AUTH: {
    ROOT: '/(guard)/(auth)',
    LOGIN: '/(guard)/(auth)/login',
    FORGOT_PASSWORD: '/(guard)/(auth)/forgot-password',

    CREATE_ACCOUNT: {
      ROOT: '/(guard)/(auth)/create-account',
      USER_DETAILS: '/(guard)/(auth)/create-account/user-details',
      PASSWORD: '/(guard)/(auth)/create-account/password',
      EMAIL_VERIFICATION: '/(guard)/(auth)/create-account/email-verification',
    },
  },

  // ───────────────────────────────
  // APP FLOW
  // ───────────────────────────────
  APP: {
    ROOT: '/(guard)/(app)', // App root
    MAP: '/(guard)/(app)/map', // Map screen
    ALERTS: '/(guard)/(app)/alerts', // Alerts list
    ALERT_DETAIL: '/(guard)/(app)/alerts/[id]', // Dynamic alert detail
    SETTINGS: '/(guard)/(app)/settings', // Settings screen
  },
  MAP: {
    ROOT: '/(guard)/(app)/map',
    INDEX: '/(guard)/(app)/map/index',
    DEVICES: '/(guard)/(app)/map/devices',
    DEVICE_SETTINGS: '/(guard)/(app)/map/device-settings',
    DEVICE: {
      NFC: '/(guard)/(app)/map/device/nfc',
      ALARM_TYPE: '/(guard)/(app)/map/device/alarm-type',
    },
  },
  PROFILE: {
    ROOT: '/(guard)/(app)/profile',
    EDIT: '/(guard)/(app)/profile/edit',
    LOGS: '/(guard)/(app)/profile/logs',
    NOTIFICATIONS: '/(guard)/(app)/profile/notifications',
    HELP: '/(guard)/(app)/profile/help',
    SECURITY: '/(guard)/(app)/profile/security',
  },
} as const;

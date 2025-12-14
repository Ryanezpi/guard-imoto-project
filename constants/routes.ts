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
  MAP: {
    ROOT: '/(app)/map',
    INDEX: '/(app)/map/index',
    DEVICES: '/(app)/map/devices',
    DEVICE_SETTINGS: '/(app)/map/device-settings',
    DEVICE: {
      BATTERY: '/(app)/map/device/battery',
      NFC: '/(app)/map/device/nfc',
      ALARM_TYPE: '/(app)/map/device/alarm-type',
    },
  },
  PROFILE: {
    ROOT: '/(app)/profile',
    DEVICES: '/(app)/profile/devices',
    EDIT: '/(app)/profile/edit',
    LOGS: '/(app)/profile/logs',
    NOTIFICATIONS: '/(app)/profile/notifications',
    HELP: '/(app)/profile/help',
    SECURITY: '/(app)/profile/security',
  },
} as const;

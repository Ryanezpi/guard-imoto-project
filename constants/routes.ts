export const ROUTES = {
  ROOT: '/',

  // ───────────────────────────────
  // ONBOARDING FLOW
  // ───────────────────────────────
  ONBOARDING: {
    ROOT: '/(guard)/(onboarding)',
    WALKTHROUGH: '/(guard)/(onboarding)/walkthrough',
    PERMISSIONS: '/(guard)/(onboarding)/permissions',
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
      PHONE_VERIFICATION: '/(guard)/(auth)/create-account/phone-verification',
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
      BATTERY: '/(guard)/(app)/map/device/battery',
      NFC: '/(guard)/(app)/map/device/nfc',
      ALARM_TYPE: '/(guard)/(app)/map/device/alarm-type',
    },
  },
  PROFILE: {
    ROOT: '/(guard)/(app)/profile',
    DEVICES: '/(guard)/(app)/profile/devices',
    EDIT: '/(guard)/(app)/profile/edit',
    LOGS: '/(guard)/(app)/profile/logs',
    NOTIFICATIONS: '/(guard)/(app)/profile/notifications',
    HELP: '/(guard)/(app)/profile/help',
    SECURITY: '/(guard)/(app)/profile/security',
  },
} as const;

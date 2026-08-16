export const SETTING_KEYS = {
  PORTAL_OPEN: "portal.open",
  REGISTRATION_OPEN: "registration.open",
  ATTENDANCE_OPEN: "attendance.open",
  MAINTENANCE_MODE: "maintenance.mode",
  ORG_NAME: "org.name",
  DEFAULT_TIMEZONE: "org.timezone",
  SUPPORT_EMAIL: "org.supportEmail",
} as const;

export const DEFAULT_TIMEZONE = "Asia/Karachi";

export const SESSION_COOKIE = "cgs_admin_session";

export const ATTENDANCE_RATE_LIMIT = {
  key: (ip: string) => `attendance:${ip}`,
  limit: 20,
  windowMs: 10 * 60 * 1000,
};

export const LOGIN_RATE_LIMIT = {
  key: (ip: string) => `login:${ip}`,
  limit: 10,
  windowMs: 15 * 60 * 1000,
};

export const ADMIN_BASE_PATH = "/cgs-oap-a7f8e2d1b9c4k6m3";

export const AUDIT_ACTIONS = {
  ADMIN_LOGIN: "admin.login",
  ADMIN_LOGOUT: "admin.logout",
  ADMIN_CREATE: "admin.create",
  ADMIN_UPDATE: "admin.update",
  ADMIN_DEACTIVATE: "admin.deactivate",
  ADMIN_DELETE: "admin.delete",
  SESSION_CREATE: "session.create",
  SESSION_UPDATE: "session.update",
  SESSION_ARCHIVE: "session.archive",
  SESSION_RESTORE: "session.restore",
  SPEAKER_CREATE: "speaker.create",
  SPEAKER_UPDATE: "speaker.update",
  SPEAKER_DEACTIVATE: "speaker.deactivate",
  REGISTRANT_DELETE: "registrant.delete",
  REGISTRANT_DELETE_ALL: "registrant.delete_all",
  ATTENDANCE_OVERRIDE: "attendance.override",
  ATTENDANCE_REMOVE: "attendance.remove",
  SYNC_START: "sync.start",
  SYNC_COMPLETE: "sync.complete",
  SYNC_FAIL: "sync.fail",
  SETTINGS_UPDATE: "settings.update",
  PORTAL_TOGGLE: "portal.toggle",
  CONNECTION_CREATE: "connection.create",
  CONNECTION_UPDATE: "connection.update",
  CONNECTION_DELETE: "connection.delete",
  AUDIT_CLEAR: "audit.clear",
} as const;
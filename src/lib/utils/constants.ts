export const APP_NAME = "Diesel-X";

export const ROLES = ["owner", "admin", "mechanic", "customer", "viewer"] as const;
export type UserRole = (typeof ROLES)[number];

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  owner: 5,
  admin: 4,
  mechanic: 3,
  customer: 2,
  viewer: 1,
};

export const MAX_PHOTOS = 5;
export const MAX_VIDEOS = 2;
export const MAX_VIDEO_DURATION_SECONDS = 120; // 2 minutes
export const MAX_FILE_SIZE_MB = 100;

export const COOKIE_OPERATOR_NAME = "diesel-x-operator-name";
export const COOKIE_OPERATOR_PHONE = "diesel-x-operator-phone";

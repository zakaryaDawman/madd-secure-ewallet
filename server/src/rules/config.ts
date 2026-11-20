/** Detection rule thresholds (R1–R4). The rules themselves are added in task D1. */
export const ruleConfig = {
  largeAmountFloorSen: 500_00, // R1: never flag below RM 500
  largeAmountMultiplier: 3, // R1: flag above 3x the user's average transfer
  velocityMaxTransfers: 3, // R2: more than 3 transfers...
  velocityWindowMinutes: 5, // R2: ...within 5 minutes
  failedLoginMax: 5, // R4: 5 failed logins...
  failedLoginWindowMinutes: 15, // R4: ...within 15 minutes
  lockMinutes: 15, // R4 + PIN lock duration
  holdMinutes: 5, // held transfer expires after 5 minutes
};

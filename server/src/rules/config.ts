/** Detection rule thresholds (R1–R4), the PIN lock and the emailed code limits. Change a number here and every rule and test follows. */
export const ruleConfig = {
  largeAmountFloorSen: 500_00, // R1: never flag below RM 500
  largeAmountMultiplier: 3, // R1: flag above 3x the user's average transfer
  velocityMaxTransfers: 3, // R2: more than 3 transfers...
  velocityWindowMinutes: 5, // R2: ...within 5 minutes
  failedLoginMax: 5, // R4: 5 failed logins...
  failedLoginWindowMinutes: 15, // R4: ...within 15 minutes
  lockMinutes: 15, // R4 + PIN lock duration
  pinMaxTries: 5, // 5 wrong PINs in a row lock transfers
  holdMinutes: 5, // held transfer expires after 5 minutes
  otpMinutes: 5, // an emailed code works for 5 minutes (task G4)
  otpMaxTries: 5, // 5 wrong codes lock that code
  otpResendSeconds: 60, // wait 60 s before asking for a new code
  otpMaxSends: 3, // at most 3 emails per code (the first + 2 resends)
  // How serious each rule's alert is, shown to the admin (task E2): a new phone or password guessing is riskier.
  severity: { R1: 'Medium', R2: 'Medium', R3: 'High', R4: 'High' } as const,
};

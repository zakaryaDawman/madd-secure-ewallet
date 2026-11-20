/**
 * What every detection rule returns: did it fire, a short sentence saying why (shown to the owner),
 * and the numbers it used (`details`), saved in the security log so the admin sees the exact calculation (task E2).
 */
export type RuleResult<Details> = { fired: boolean; reason: string; details: Details };

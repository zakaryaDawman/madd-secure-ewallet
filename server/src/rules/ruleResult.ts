/** What every detection rule returns: did it fire, and a short sentence saying why (shown to the owner and the admin). */
export type RuleResult = { fired: boolean; reason: string };

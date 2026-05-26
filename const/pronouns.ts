/**
 * Preset pronoun options offered during registration and profile editing.
 *
 * @remarks
 * Includes common neopronoun sets and `"other"` for custom entry elsewhere in the UI.
 * Order is presentation-only; not locale-sorted.
 */
const Pronouns: readonly string[]= [
  "he/him",
  "she/her",
  "they/them",
  "it/its",
  "one/one's",
  "ae/aer",
  "co/cos",
  "e/em/eir",
  "e/em/es",
  "ey/em",
  "fae/faer",
  "hu/hum",
  "ne/nem",
  "ne/nir",
  "per/per",
  "s/he/hir",
  "thon/thons",
  "ve/ver",
  "vi/vir",
  "vi/vim",
  "xe/xem",
  "ze/hir",
  "ze/zir",
  "zhe/zher",
  "other",
] as const;

export { Pronouns };

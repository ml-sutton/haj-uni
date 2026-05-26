/**
 * A single contributor entry for the About / credits screen.
 *
 * @property alias - Display name or handle.
 * @property pronouns - Pronouns shown alongside the name.
 * @property title - Role on the project (e.g. engineer, designer).
 */
type Credit = {
  alias: string;
  pronouns: string;
  title: string;
};

/**
 * Ordered list of project contributors shown in the app credits UI.
 *
 * @remarks
 * Maintain display order here; the About screen renders this array as-is.
 */
const Credits: Credit[] = [
  {
    alias: "Madison",
    pronouns: "they/them",
    title: "Lead Engineer",
  },
  {
    alias: "Freyja",
    pronouns: "fae/faer",
    title: "Treasurer"
  },
  {
    alias: "Iris",
    pronouns: "she/it",
    title: "Graphic Designer"
  },
  {
    alias: "Kai",
    pronouns: "he/they",
    title: "Donor"
  },
  {
    alias: "Luna",
    pronouns: "she/they",
    title: "Donor"
  }
];

export { Credits, type Credit };

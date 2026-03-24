type Credit = {
  alias: string;
  pronouns: string;
  title: string; 
}

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

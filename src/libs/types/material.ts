export type Material = {
  id: string;
  name: string;
  category: string;
};

export const materials: Material[] = [
  { id: "1", name: "Plastic Bottle", category: "Plastic" },
  { id: "2", name: "Paper", category: "Paper" },
  { id: "3", name: "Aluminum Can", category: "Metal" },
  { id: "4", name: "Glass Jar", category: "Glass" },
];

import type { Measurement } from "./measurement";

export type Item = {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: Measurement;
};

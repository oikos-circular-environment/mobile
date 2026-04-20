import type { Measurement } from "./measurement";
import type { WasteType } from "./waste";

export type Item = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  unit: Measurement;
  wasteType: WasteType;
  sub_items: string[] | null; // Subitens relacionados ao resíduo, como os materiais que compõem o resíduo
};

export type WasteType = "RECYCLABLE" | "GARBAGE";

export type MeasurementSymbol = "KG" | "L" | "UNIT";

export type Measurement = {
  name: string;
  symbol: MeasurementSymbol;
};

type Material = {
  name: string;
  category: string;
}

export type Waste = {
  id: string;
  waste: Material;
  amount: number;
  unit: Measurement;
  wasteType: WasteType;
  price: number; // Preço por unidade de medida
}

export type Service = {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: Measurement;
}

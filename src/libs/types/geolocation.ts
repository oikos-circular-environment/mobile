import type { Address } from "./address";

export type Geolocation = {
  id: string;
  address: Address;
  date: string;
  altitude: number;
  compass: number;
  latitude: number;
  longitude: number;
};

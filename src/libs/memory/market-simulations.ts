export type MarketSimulationItemType = "waste" | "service";

export type MarketSimulationDraft = {
  companyId: string;
  itemId: string;
  itemType: MarketSimulationItemType;
  quantity: number;
  note: string;
  unitPrice: number;
  total: number;
  updatedAt: number;
};

export type MarketCheckoutItemDraft = {
  itemId: string;
  itemType: MarketSimulationItemType;
  itemName: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  note: string;
  total: number;
};

export type MarketCheckoutDraft = {
  companyId: string;
  items: MarketCheckoutItemDraft[];
  updatedAt: number;
};

const simulationStore = new Map<string, MarketSimulationDraft>();
const checkoutStore = new Map<string, MarketCheckoutDraft>();

const buildSimulationKey = (
  companyId: string,
  itemType: MarketSimulationItemType,
  itemId: string,
) => `${companyId}:${itemType}:${itemId}`;

export const getMarketSimulationDraft = (
  companyId: string,
  itemType: MarketSimulationItemType,
  itemId: string,
) =>
  simulationStore.get(buildSimulationKey(companyId, itemType, itemId)) ?? null;

export const saveMarketSimulationDraft = (draft: MarketSimulationDraft) => {
  const key = buildSimulationKey(draft.companyId, draft.itemType, draft.itemId);
  simulationStore.set(key, draft);
};

export const getMarketCheckoutDraft = (companyId: string) =>
  checkoutStore.get(companyId) ?? null;

export const saveMarketCheckoutDraft = (draft: MarketCheckoutDraft) => {
  checkoutStore.set(draft.companyId, draft);
};

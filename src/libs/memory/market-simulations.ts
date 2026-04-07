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

const simulationStore = new Map<string, MarketSimulationDraft>();

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

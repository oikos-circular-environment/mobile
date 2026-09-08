import type { GetV1WasteCategoriesResponses } from "@oikos-circular-environment/oikos-sdk";

export type WasteCategory =
	GetV1WasteCategoriesResponses[200]["categories"][number];

export type WasteCategoryHazardLevel = WasteCategory["hazard_levels"][number];
export type WasteCategorySubcategory = WasteCategory["subcategories"][number];

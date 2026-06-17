import type { VariantProps } from "@gluestack-ui/utils/nativewind-utils";
import {
	tva,
	useStyleContext,
	withStyleContext,
} from "@gluestack-ui/utils/nativewind-utils";
import React from "react";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import type { WasteCategory as WasteCategoryModel } from "@/libs/types/waste-category";
import { useWasteCategoryContext } from "./context";

const CHIP_SCOPE = "WASTE_CATEGORY_CHIP";

const chipStyle = tva({
	base: "flex-row items-center gap-1.5 px-4 py-2 rounded-xl border",
	variants: {
		state: {
			selected: "bg-lime-800 border-lime-800",
			unselected: "bg-white border-border",
		},
	},
});

const chipTextStyle = tva({
	base: "text-sm font-medium",
	parentVariants: {
		state: {
			selected: "text-white",
			unselected: "text-foreground",
		},
	},
});

const ContextView = withStyleContext(View, CHIP_SCOPE);

// ─── WasteCategoryChips ────────────────────────────────────────────────────────

export function WasteCategoryChips({
	children,
}: {
	children: (category: WasteCategoryModel) => React.ReactNode;
}) {
	const { categories } = useWasteCategoryContext();
	return <>{categories.map(cat => children(cat))}</>;
}

// ─── WasteCategoryChip ─────────────────────────────────────────────────────────

type IWasteCategoryChipProps = Omit<
	React.ComponentPropsWithoutRef<typeof Pressable>,
	"children"
> &
	VariantProps<typeof chipStyle> & {
		category: WasteCategoryModel;
		className?: string;
		children?: React.ReactNode;
	};

export function WasteCategoryChip({
	category,
	children,
	className,
	...pressableProps
}: IWasteCategoryChipProps) {
	const {
		selectionMode,
		selectedWasteCategory,
		selectedWasteCategories,
		onSelect,
	} = useWasteCategoryContext();

	const isSelected =
		selectionMode === "multiple"
			? selectedWasteCategories.some(c => c.id === category.id)
			: category.id === selectedWasteCategory?.id;

	const state = isSelected ? "selected" : "unselected";

	return (
		<Pressable onPress={() => onSelect(category)} {...pressableProps}>
			<ContextView
				className={chipStyle({ state, class: className })}
				context={{ state }}
			>
				{children}
			</ContextView>
		</Pressable>
	);
}

// ─── WasteCategoryChipText ─────────────────────────────────────────────────────

type IWasteCategoryChipTextProps = React.ComponentPropsWithoutRef<typeof Text> &
	VariantProps<typeof chipTextStyle>;

export const WasteCategoryChipText = React.forwardRef<
	React.ComponentRef<typeof Text>,
	IWasteCategoryChipTextProps
>(function WasteCategoryChipText({ children, className, ...props }, ref) {
	const { state: parentState } = useStyleContext(CHIP_SCOPE);
	return (
		<Text
			ref={ref}
			className={chipTextStyle({
				parentVariants: { state: parentState },
				class: className,
			})}
			{...props}
		>
			{children}
		</Text>
	);
});

WasteCategoryChips.displayName = "WasteCategoryChips";
WasteCategoryChip.displayName = "WasteCategoryChip";
WasteCategoryChipText.displayName = "WasteCategoryChipText";

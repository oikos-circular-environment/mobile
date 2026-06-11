import { useEffect, useRef, useState } from "react";
import type { ViewProps } from "react-native";
import type { WasteCategory as WasteCategoryModel } from "@/libs/types/waste-category";
import { useWasteCategories } from "@/components/companies/hooks/use-waste-categories";
import { Skeleton } from "@/components/ui/skeleton";
import { VStack } from "@/components/ui/vstack";
import { WasteCategoryContext } from "./context";

export interface WasteCategoryProps extends ViewProps {
	defaultCategoryId?: string;
	onSelectionChange?: (category: WasteCategoryModel) => void;
}

export function WasteCategory({
	children,
	defaultCategoryId,
	onSelectionChange,
	...props
}: WasteCategoryProps) {
	const { categories, isLoading } = useWasteCategories();
	const [selectedWasteCategory, setSelectedWasteCategory] =
		useState<WasteCategoryModel | null>(null);

	const initializedRef = useRef(false);
	const onSelectionChangeRef = useRef(onSelectionChange);
	onSelectionChangeRef.current = onSelectionChange;

	useEffect(() => {
		if (categories.length > 0 && !initializedRef.current) {
			initializedRef.current = true;
			const initial =
				(defaultCategoryId &&
					categories.find(c => c.id === defaultCategoryId)) ||
				categories[0];
			setSelectedWasteCategory(initial);
			onSelectionChangeRef.current?.(initial);
		}
	}, [categories, defaultCategoryId]);

	const handleSelect = (category: WasteCategoryModel) => {
		setSelectedWasteCategory(category);
		onSelectionChangeRef.current?.(category);
	};

	if (isLoading) return <WasteCategorySkeleton />;

	return (
		<WasteCategoryContext.Provider
			value={{ categories, selectedWasteCategory, onSelect: handleSelect }}
		>
			<VStack space="lg" {...props}>
				{children}
			</VStack>
		</WasteCategoryContext.Provider>
	);
}

export function WasteCategorySkeleton() {
	return (
		<VStack className="flex-row gap-2">
			{[1, 2, 3, 4].map(i => (
				<Skeleton key={i} className="h-9 w-24 rounded-xl bg-secondary/60" />
			))}
		</VStack>
	);
}

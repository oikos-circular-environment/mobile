import { useEffect, useMemo, useRef, useState } from "react";
import type { ViewProps } from "react-native";
import { useWasteCategories } from "@/components/companies/hooks/use-waste-categories";
import { Skeleton } from "@/components/ui/skeleton";
import { VStack } from "@/components/ui/vstack";
import type { WasteCategory as WasteCategoryModel } from "@/libs/types/waste-category";
import { WasteCategoryContext } from "./context";

type WasteCategoryBaseProps = ViewProps & {
	children?: React.ReactNode;
};

type WasteCategorySingleProps = WasteCategoryBaseProps & {
	selectionMode?: "single";
	defaultCategoryId?: string;
	onSelectionChange?: (category: WasteCategoryModel) => void;
};

type WasteCategoryMultiProps = WasteCategoryBaseProps & {
	selectionMode: "multiple";
	defaultCategoryIds?: string[];
	onSelectionChange?: (categories: WasteCategoryModel[]) => void;
};

export type WasteCategoryProps =
	| WasteCategorySingleProps
	| WasteCategoryMultiProps;

export function WasteCategory(props: WasteCategoryProps) {
	const { children, selectionMode = "single", ...viewProps } = props;
	const isMulti = selectionMode === "multiple";

	const { categories, isLoading } = useWasteCategories();

	const [selectedCategory, setSelectedCategory] =
		useState<WasteCategoryModel | null>(null);
	const [selectedCategories, setSelectedCategories] = useState<
		WasteCategoryModel[]
	>([]);

	const defaultCategoryId = !isMulti
		? (props as WasteCategorySingleProps).defaultCategoryId
		: undefined;
	const defaultCategoryIds = isMulti
		? (props as WasteCategoryMultiProps).defaultCategoryIds
		: undefined;

	const initializedRef = useRef(false);
	const onChangeRef = useRef(props.onSelectionChange);
	onChangeRef.current = props.onSelectionChange;

	useEffect(() => {
		if (categories.length === 0 || initializedRef.current) return;
		initializedRef.current = true;

		if (isMulti) {
			const initial = categories.filter(c =>
				(defaultCategoryIds ?? []).includes(c.id),
			);
			setSelectedCategories(initial);
			if (initial.length > 0) setSelectedCategory(initial[0]);
			(onChangeRef.current as (cats: WasteCategoryModel[]) => void)?.(initial);
		} else {
			const initial =
				(defaultCategoryId &&
					categories.find(c => c.id === defaultCategoryId)) ||
				categories[0];
			setSelectedCategory(initial);
			(onChangeRef.current as (cat: WasteCategoryModel) => void)?.(initial);
		}
	}, [categories, isMulti, defaultCategoryId, defaultCategoryIds]);

	const effectiveSelectedCategory = useMemo(() => {
		if (selectedCategory !== null) return selectedCategory;
		if (!isMulti && categories.length > 0) {
			return (
				(defaultCategoryId &&
					categories.find(c => c.id === defaultCategoryId)) ||
				categories[0]
			);
		}
		return null;
	}, [selectedCategory, isMulti, categories, defaultCategoryId]);

	const handleSelect = (category: WasteCategoryModel) => {
		if (isMulti) {
			const exists = selectedCategories.some(c => c.id === category.id);
			const updated = exists
				? selectedCategories.filter(c => c.id !== category.id)
				: [...selectedCategories, category];
			setSelectedCategories(updated);

			if (exists) {
				setSelectedCategory(
					selectedCategory?.id === category.id
						? (updated[0] ?? null)
						: selectedCategory,
				);
			} else {
				setSelectedCategory(category);
			}

			(onChangeRef.current as (cats: WasteCategoryModel[]) => void)?.(updated);
		} else {
			setSelectedCategory(category);
			(onChangeRef.current as (cat: WasteCategoryModel) => void)?.(category);
		}
	};

	if (isLoading) return <WasteCategorySkeleton />;

	return (
		<WasteCategoryContext.Provider
			value={{
				categories,
				selectionMode,
				selectedWasteCategory: effectiveSelectedCategory,
				selectedWasteCategories: selectedCategories,
				onSelect: handleSelect,
			}}
		>
			<VStack space="lg" {...viewProps}>
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

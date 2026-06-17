import {
	ChevronDownIcon,
	ChevronsUpIcon,
	ChevronUpIcon,
	MinusIcon,
	RadarIcon,
	RecycleIcon,
	ShieldCheckIcon,
	ShieldIcon,
} from "lucide-react-native";
import type React from "react";
import { TouchableOpacity, View } from "react-native";
import {
	ComplaintPressableFilter,
	ComplaintPressableFilterIcon,
	ComplaintPressableFilterText,
} from "@/components/complaints/complaint-pressable-filter";
import type { HazardLevelVariant } from "@/components/custom/waste-category";
import {
	BottomSheet,
	BottomSheetBackdrop,
	BottomSheetDragIndicator,
	BottomSheetPortal,
	type BottomSheetRef,
	BottomSheetScrollView,
} from "@/components/ui/bottomsheet";

export type { BottomSheetRef };

import { Divider } from "@/components/ui/divider";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import type { WasteCategory } from "@/libs/types/waste-category";

export const RADIUS_OPTIONS = [
	{ label: "2 km", value: 2000 },
	{ label: "5 km", value: 5000 },
	{ label: "10 km", value: 10000 },
	{ label: "15 km", value: 15000 },
	{ label: "20 km", value: 20000 },
	{ label: "30 km", value: 30000 },
	{ label: "40 km", value: 40000 },
];

const STATUS_OPTIONS = [
	{ key: "ALL", label: "Todos", icon: null },
	{ key: "OPEN", label: "Aberta", icon: ShieldIcon },
	{ key: "RESOLVED", label: "Resolvida", icon: ShieldCheckIcon },
] as const;

const HAZARD_OPTIONS = [
	{ key: "all", label: "Todos", icon: null },
	{ key: "low", label: "Baixa", icon: ChevronDownIcon },
	{ key: "medium", label: "Média", icon: MinusIcon },
	{ key: "high", label: "Alta", icon: ChevronUpIcon },
	{ key: "very_high", label: "Muito alta", icon: ChevronsUpIcon },
] as const;

export type FilterState = {
	status: "ALL" | "OPEN" | "RESOLVED";
	category: WasteCategory | null;
	hazardLevel: "all" | HazardLevelVariant;
	radius: number;
};

export const DEFAULT_FILTERS: FilterState = {
	status: "OPEN",
	category: null,
	hazardLevel: "all",
	radius: 2000,
};

type ComplaintFilterBottomSheetProps = {
	ref?: React.Ref<BottomSheetRef>;
	filters: FilterState;
	categories: WasteCategory[];
	onFiltersChange: (filters: FilterState) => void;
	onApply: () => void;
	onClear: () => void;
};

export function ComplaintFilterBottomSheet({
	ref,
	filters,
	categories,
	onFiltersChange,
	onApply,
	onClear,
}: ComplaintFilterBottomSheetProps) {
	return (
		<BottomSheet ref={ref}>
			<BottomSheetPortal
				snapPoints={["90%"]}
				backdropComponent={BottomSheetBackdrop}
				handleComponent={BottomSheetDragIndicator}
			>
				<BottomSheetScrollView
					contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
				>
					<Heading size="md" className="mb-4 text-gray-900">
						Filtros
					</Heading>

					<Text className="text-sm font-semibold text-muted-foreground mb-3">
						Categorias de resíduos
					</Text>
					<View className="flex-row flex-wrap gap-2 mb-4">
						<ComplaintPressableFilter
							selected={filters.category === null}
							onPress={() => onFiltersChange({ ...filters, category: null })}
						>
							<ComplaintPressableFilterIcon as={RecycleIcon} />
							<ComplaintPressableFilterText>Todos</ComplaintPressableFilterText>
						</ComplaintPressableFilter>
						{categories.map(cat => (
							<ComplaintPressableFilter
								key={cat.id}
								selected={filters.category?.id === cat.id}
								onPress={() =>
									onFiltersChange({
										...filters,
										category: filters.category?.id === cat.id ? null : cat,
									})
								}
							>
								<ComplaintPressableFilterIcon as={RecycleIcon} />
								<ComplaintPressableFilterText>
									{cat.name}
								</ComplaintPressableFilterText>
							</ComplaintPressableFilter>
						))}
					</View>

					<Divider className="mb-4" />

					<Text className="text-sm font-semibold text-muted-foreground mb-3">
						Periculosidade
					</Text>
					<View className="flex-row flex-wrap gap-2 mb-4">
						{HAZARD_OPTIONS.map(({ key, label, icon }) => (
							<ComplaintPressableFilter
								key={key}
								selected={filters.hazardLevel === key}
								onPress={() =>
									onFiltersChange({
										...filters,
										hazardLevel: key,
									})
								}
							>
								{icon && <ComplaintPressableFilterIcon as={icon} />}
								<ComplaintPressableFilterText>
									{label}
								</ComplaintPressableFilterText>
							</ComplaintPressableFilter>
						))}
					</View>

					<Divider className="mb-4" />

					<Text className="text-sm font-semibold text-muted-foreground mb-3">
						Status
					</Text>
					<View className="flex-row flex-wrap gap-2 mb-4">
						{STATUS_OPTIONS.map(({ key, label, icon }) => (
							<ComplaintPressableFilter
								key={key}
								selected={filters.status === key}
								onPress={() =>
									onFiltersChange({
										...filters,
										status: key,
									})
								}
							>
								{icon && <ComplaintPressableFilterIcon as={icon} />}
								<ComplaintPressableFilterText>
									{label}
								</ComplaintPressableFilterText>
							</ComplaintPressableFilter>
						))}
					</View>

					<Divider className="mb-4" />

					<Text className="text-sm font-semibold text-muted-foreground mb-3">
						Raio de busca
					</Text>
					<View className="flex-row flex-wrap gap-2 mb-6">
						{RADIUS_OPTIONS.map(({ label, value }) => (
							<ComplaintPressableFilter
								key={value}
								selected={filters.radius === value}
								onPress={() => onFiltersChange({ ...filters, radius: value })}
							>
								<ComplaintPressableFilterIcon as={RadarIcon} />
								<ComplaintPressableFilterText>
									{label}
								</ComplaintPressableFilterText>
							</ComplaintPressableFilter>
						))}
					</View>

					<HStack className="gap-3">
						<TouchableOpacity
							activeOpacity={0.8}
							onPress={onClear}
							className="flex-1 h-11 items-center justify-center rounded-xl border border-border bg-white"
						>
							<Text className="text-sm font-semibold text-foreground">
								Limpar
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							activeOpacity={0.85}
							onPress={onApply}
							className="flex-1 h-11 items-center justify-center rounded-xl bg-lime-800"
						>
							<Text className="text-sm font-semibold text-white">Aplicar</Text>
						</TouchableOpacity>
					</HStack>
				</BottomSheetScrollView>
			</BottomSheetPortal>
		</BottomSheet>
	);
}

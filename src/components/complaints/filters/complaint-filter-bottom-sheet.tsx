import GorhomBottomSheet, {
	BottomSheetBackdrop,
	type BottomSheetBackdropProps,
	BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
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
import { useCallback, useImperativeHandle, useRef } from "react";
import { TouchableOpacity, View } from "react-native";
import {
	ComplaintPressableFilter,
	ComplaintPressableFilterIcon,
	ComplaintPressableFilterText,
} from "@/components/complaints/filters/complaint-pressable-filter";
import { Divider } from "@/components/ui/divider";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import type { WasteCategory } from "@/libs/types/waste-category";
import { type BottomSheetRef, type FilterState, RADIUS_OPTIONS } from "./types";

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
	const sheetRef = useRef<GorhomBottomSheet>(null);

	useImperativeHandle(
		ref,
		() => ({
			open: () => sheetRef.current?.snapToIndex(0),
			close: () => sheetRef.current?.close(),
			snapToIndex: index => sheetRef.current?.snapToIndex(index),
			expand: () => sheetRef.current?.expand(),
			collapse: () => sheetRef.current?.collapse(),
		}),
		[],
	);

	const backdropComponent = useCallback(
		(props: BottomSheetBackdropProps) => (
			<BottomSheetBackdrop
				{...props}
				appearsOnIndex={0}
				disappearsOnIndex={-1}
			/>
		),
		[],
	);

	return (
		<GorhomBottomSheet
			ref={sheetRef}
			index={-1}
			snapPoints={["90%"]}
			enablePanDownToClose
			backdropComponent={backdropComponent}
			handleIndicatorStyle={{ backgroundColor: "#d1d5db", width: 40 }}
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
		</GorhomBottomSheet>
	);
}

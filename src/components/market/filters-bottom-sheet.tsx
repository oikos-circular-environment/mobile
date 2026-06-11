import { CheckIcon, FunnelIcon, LocateIcon, RecycleIcon, WrenchIcon } from "lucide-react-native";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { View } from "react-native";
import {
	BottomSheet,
	BottomSheetBackdrop,
	BottomSheetDragIndicator,
	BottomSheetPortal,
	type BottomSheetRef,
	BottomSheetScrollView,
} from "@/components/ui/bottomsheet";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { useGeospatial } from "@/contexts/geospatial-context";
import { useMarket } from "@/contexts/market-context";

const radiusOptions = [
	{ value: "2000", label: "2 km" },
	{ value: "5000", label: "5 km" },
	{ value: "10000", label: "10 km" },
	{ value: "15000", label: "15 km" },
	{ value: "40000", label: "40 km" },
	{ value: "30000", label: "30 km" },
	{ value: "20000", label: "20 km" },
] as const;

type CategoryOption = {
	value: "waste" | "services" | undefined;
	label: string;
	icon: typeof RecycleIcon;
};

const categoryOptions: CategoryOption[] = [
	{ value: undefined, label: "Todos", icon: FunnelIcon },
	{ value: "waste", label: "Resíduos", icon: RecycleIcon },
	{ value: "services", label: "Serviços", icon: WrenchIcon },
];

export interface FiltersBottomSheetRef {
	open: () => void;
	close: () => void;
}

export const FiltersBottomSheet = forwardRef<FiltersBottomSheetRef>(function FiltersBottomSheet(_props, ref) {
	const { addresses } = useGeospatial();
	const { appliedFilters, setAppliedFilters } = useMarket();
	const [isOpen, setIsOpen] = useState(false);
	const sheetRef = useRef<BottomSheetRef>(null);

	const [localRadius, setLocalRadius] = useState(appliedFilters.radius);
	const [localCategory, setLocalCategory] = useState(appliedFilters.category);

	useEffect(() => {
		if (isOpen) {
			setLocalRadius(appliedFilters.radius);
			setLocalCategory(appliedFilters.category);
			sheetRef.current?.open();
		} else {
			sheetRef.current?.close();
		}
	}, [isOpen, appliedFilters]);

	useImperativeHandle(ref, () => ({
		open: () => setIsOpen(true),
		close: () => setIsOpen(false),
	}));

	const handleApply = useCallback(() => {
		setAppliedFilters({ ...appliedFilters, radius: localRadius, category: localCategory });
		setIsOpen(false);
	}, [appliedFilters, localRadius, localCategory, setAppliedFilters]);

	const handleClear = useCallback(() => {
		setLocalRadius("2000");
		setLocalCategory(undefined);
	}, []);

	const currentAddressText = addresses[0]
		? [addresses[0].streetNumber, addresses[0].street, addresses[0].district]
				.filter(Boolean)
				.join(", ")
		: "Obtendo endereço...";

	return (
		<BottomSheet ref={sheetRef} onClose={() => setIsOpen(false)}>
			<BottomSheetPortal
				snapPoints={["70%"]}
				backdropComponent={BottomSheetBackdrop}
				handleComponent={BottomSheetDragIndicator}
			>
				<BottomSheetScrollView contentContainerClassName="gap-4 px-4 pb-8">
					<Heading size="sm" className="text-base text-foreground">
						Filtros
					</Heading>

					<View className="gap-2">
						<Text className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
							Localização
						</Text>
						<View className="flex-row items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary">
							<View className="w-8 h-8 rounded-lg bg-primary items-center justify-center">
								<LocateIcon size={14} className="text-primary-foreground" />
							</View>
							<View className="flex-1">
								<Text className="text-sm font-semibold text-foreground">
									Localização atual
								</Text>
								<Text className="text-xs text-muted-foreground" numberOfLines={1}>
									{currentAddressText}
								</Text>
							</View>
							<CheckIcon size={16} className="text-primary" />
						</View>
					</View>

					<View className="gap-2">
						<Text className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
							Raio
						</Text>
						<View className="flex-row flex-wrap gap-2">
							{radiusOptions.map(option => (
								<Button
									key={option.value}
									variant={localRadius === option.value ? "default" : "outline"}
									size="sm"
									onPress={() => setLocalRadius(option.value)}
								>
									<ButtonText>{option.label}</ButtonText>
								</Button>
							))}
						</View>
					</View>

					<View className="gap-2">
						<Text className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
							Categoria
						</Text>
						<View className="flex-row gap-2">
							{categoryOptions.map(option => (
								<Button
									key={option.label}
									variant={localCategory === option.value ? "default" : "outline"}
									size="sm"
									onPress={() => setLocalCategory(option.value)}
								>
									<ButtonIcon as={option.icon} />
									<ButtonText>{option.label}</ButtonText>
								</Button>
							))}
						</View>
					</View>

					<View className="flex-row gap-2 pt-2">
						<Button variant="ghost" size="default" onPress={handleClear}>
							<ButtonText className="text-muted-foreground">Limpar</ButtonText>
						</Button>
						<Button className="flex-1 h-12 rounded-md" onPress={handleApply}>
							<ButtonText>Aplicar filtros</ButtonText>
						</Button>
					</View>
				</BottomSheetScrollView>
			</BottomSheetPortal>
		</BottomSheet>
	);
});

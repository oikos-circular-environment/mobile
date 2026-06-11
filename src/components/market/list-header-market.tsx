import { zodResolver } from "@hookform/resolvers/zod";
import {
	AlertCircleIcon,
	ChevronDown,
	MapPinIcon,
	NavigationIcon,
	RecycleIcon,
	Search,
	WrenchIcon,
} from "lucide-react-native";
import { Controller, useForm } from "react-hook-form";
import { Pressable, View } from "react-native";
import type { LocationSheetRef } from "@/components/market/location-source-select";
import type { RadiusBottomSheetRef } from "@/components/market/radius-bottom-sheet";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import {
	FormControl,
	FormControlError,
	FormControlErrorIcon,
	FormControlErrorText,
} from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useGeospatial } from "@/contexts/geospatial-context";
import {
	type MarketFilterValues,
	marketFilterSchema,
	useMarket,
} from "@/contexts/market-context";

interface MarketListHeaderProps {
	filtersSheetRef: React.RefObject<RadiusBottomSheetRef | null>;
	locationSheetRef: React.RefObject<LocationSheetRef | null>;
}

export function MarketListHeader({
	filtersSheetRef,
	locationSheetRef,
}: MarketListHeaderProps) {
	const { addresses } = useGeospatial();
	const { setAppliedFilters, companies } = useMarket();

	const {
		control,
		handleSubmit,
		watch,
		setValue,
		getValues,
		formState: { errors },
	} = useForm<MarketFilterValues>({
		resolver: zodResolver(marketFilterSchema),
		defaultValues: { query: "", radius: "2000", category: undefined },
	});

	const categoryValue = watch("category");
	const radiusValue = watch("radius");
	const onSubmit = handleSubmit(values => setAppliedFilters(values));

	const formatRadiusLabel = (value: string) => {
		const km = Number(value) / 1000;
		return `${km} km`;
	};

	const currentAddressText = addresses[0]
		? [addresses[0].streetNumber, addresses[0].street, addresses[0].district]
				.filter(Boolean)
				.join(", ")
		: "Obtendo endereço...";

	return (
		<View className="gap-4 pt-2 pb-2">
			<Pressable onPress={() => locationSheetRef.current?.open()}>
				<HStack className="items-center gap-2">
					<View className="bg-primary rounded-lg w-7 h-7 items-center justify-center">
						<MapPinIcon size={14} className="text-primary-foreground" />
					</View>
					<Text className="flex-1 text-sm font-medium" numberOfLines={1}>
						{currentAddressText}
					</Text>
					<ChevronDown size={14} className="text-muted-foreground" />
				</HStack>
			</Pressable>

			<FormControl isInvalid={!!errors.query}>
				<Controller
					control={control}
					name="query"
					render={({ field: { onChange, onBlur, value } }) => (
						<HStack className="gap-2">
							<Input className="flex-1 rounded-lg border-border bg-background">
								<InputSlot className="pl-3">
									<InputIcon as={Search} className="text-muted-foreground" />
								</InputSlot>
								<InputField
									value={value}
									onBlur={onBlur}
									onChangeText={onChange}
									onSubmitEditing={onSubmit}
									returnKeyType="search"
									placeholder="Empresas, resíduos ou serviços"
								/>
							</Input>
						</HStack>
					)}
				/>
				{errors.query?.message && (
					<FormControlError>
						<FormControlErrorIcon as={AlertCircleIcon} />
						<FormControlErrorText>{errors.query.message}</FormControlErrorText>
					</FormControlError>
				)}
			</FormControl>

			<View className="flex-row gap-2">
				<Button
					variant={categoryValue === "waste" ? "default" : "outline"}
					className="flex-1"
					onPress={() => {
						const next = categoryValue === "waste" ? undefined : "waste";
						setValue("category", next, { shouldDirty: true });
						setAppliedFilters({ ...getValues(), category: next });
					}}
				>
					<ButtonIcon as={RecycleIcon} />
					<ButtonText>Resíduos</ButtonText>
				</Button>
				<Button
					variant={categoryValue === "services" ? "default" : "outline"}
					className="flex-1"
					onPress={() => {
						const next = categoryValue === "services" ? undefined : "services";
						setValue("category", next, { shouldDirty: true });
						setAppliedFilters({ ...getValues(), category: next });
					}}
				>
					<ButtonIcon as={WrenchIcon} />
					<ButtonText>Serviços</ButtonText>
				</Button>
				<Button
					variant="outline"
					className="flex-1"
					onPress={() => filtersSheetRef.current?.open()}
				>
					<ButtonIcon as={NavigationIcon} />
					<ButtonText>{formatRadiusLabel(radiusValue)}</ButtonText>
				</Button>
			</View>

			<HStack className="items-end justify-between">
				<Heading className="text-lg font-semibold">Ecossistema</Heading>
				<Text className="text-xs text-muted-foreground">
					{companies.length} resultados
				</Text>
			</HStack>
		</View>
	);
}

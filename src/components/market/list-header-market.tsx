import { zodResolver } from "@hookform/resolvers/zod";
import {
	AlertCircleIcon,
	RecycleIcon,
	Search,
	WrenchIcon,
} from "lucide-react-native";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { LocationSourceBottomSheet } from "@/components/market/location-source-bottom-sheet";
import { RadiusBottomSheet } from "@/components/market/radius-bottom-sheet";
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
import {
	type MarketFilterValues,
	marketFilterSchema,
	useMarket,
} from "@/contexts/market-context";
import { cn } from "@/libs/utils";
import { colors } from "../style/colors";
import { Pressable } from "../ui/pressable";

export function MarketListHeader() {
	const { appliedFilters, setAppliedFilters, companies } = useMarket();

	const {
		control,
		handleSubmit,
		watch,
		setValue,
		formState: { errors },
	} = useForm<MarketFilterValues>({
		resolver: zodResolver(marketFilterSchema),
		defaultValues: { query: "", radius: "2000", category: undefined },
	});

	const categoryValue = watch("category");
	const onSubmit = handleSubmit(values => setAppliedFilters(values));

	return (
		<View className="gap-4 pt-2 pb-2">
			<LocationSourceBottomSheet />

			<FormControl isInvalid={!!errors.query}>
				<Controller
					control={control}
					name="query"
					render={({ field: { onChange, onBlur, value } }) => (
						<HStack className="gap-2">
							<Input className="flex-1 h-12">
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
				<Pressable
					className={cn(
						"flex-1 flex-row gap-2 itens-center justify-center rounded-md p-4",
						categoryValue === "waste" ? "bg-primary" : "border border-border",
					)}
					onPress={() => {
						const next = categoryValue === "waste" ? undefined : "waste";
						setValue("category", next, { shouldDirty: true });
						setAppliedFilters({ ...appliedFilters, category: next });
					}}
				>
					<RecycleIcon
						size={16}
						color={categoryValue === "waste" ? colors.white : colors.black}
					/>
					<Text
						className={cn(
							categoryValue === "waste" ? "text-muted" : "text-foreground",
						)}
					>
						Resíduos
					</Text>
				</Pressable>
				<Pressable
					className={cn(
						"flex-1 flex-row gap-2 itens-center justify-center rounded-md p-4",
						categoryValue === "services"
							? "bg-primary"
							: "border border-border",
					)}
					onPress={() => {
						const next = categoryValue === "services" ? undefined : "services";
						setValue("category", next, { shouldDirty: true });
						setAppliedFilters({ ...appliedFilters, category: next });
					}}
				>
					<WrenchIcon
						size={16}
						color={categoryValue === "services" ? colors.white : colors.black}
					/>
					<Text
						className={cn(
							categoryValue === "services" ? "text-muted" : "text-foreground",
						)}
					>
						Serviços
					</Text>
				</Pressable>
				<RadiusBottomSheet />
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

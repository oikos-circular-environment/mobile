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
import { View } from "react-native";
import { formatRadiusLabel } from "@/components/market/radius-bottom-sheet";
import { colors } from "@/components/style/colors";
import { Card } from "@/components/ui/card";
import {
	FormControl,
	FormControlError,
	FormControlErrorIcon,
	FormControlErrorText,
} from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { useAuthContext } from "@/contexts/auth-context";
import { useGeospatial } from "@/contexts/geospatial-context";
import {
	type MarketFilterValues,
	marketFilterSchema,
	useMarket,
} from "@/contexts/market-context";
import { cn } from "@/libs/utils";

export function MarketListHeader() {
	const {
		appliedFilters,
		setAppliedFilters,
		companies,
		locationSource,
		openLocationSheet,
		openRadiusSheet,
	} = useMarket();
	const { addresses } = useGeospatial();
	const { user } = useAuthContext();

	const profileAddress = user?.profile?.address ?? null;
	const triggerText =
		locationSource === "profile" && profileAddress
			? [profileAddress.street, profileAddress.number, profileAddress.district]
					.filter(Boolean)
					.join(", ")
			: addresses[0]
				? [
						addresses[0].streetNumber,
						addresses[0].street,
						addresses[0].district,
					]
						.filter(Boolean)
						.join(", ")
				: null;

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
	const onSubmit = handleSubmit(values =>
		setAppliedFilters({ ...appliedFilters, query: values.query }),
	);

	return (
		<View className="gap-4 pt-2 pb-2">
			<Pressable
				className="border border-border bg-card p-2 rounded-md "
				onPress={openLocationSheet}
			>
				<HStack className="items-center gap-2">
					<Card className="shadow-none p-2 bg-primary rounded-lg items-center justify-center">
						<MapPinIcon size={14} color={colors.white} />
					</Card>
					{triggerText ? (
						<Text className="flex-1 text-sm font-medium" numberOfLines={1}>
							{triggerText}
						</Text>
					) : (
						<View className="flex-1">
							<Skeleton className="h-4" />
						</View>
					)}
					<ChevronDown size={14} color={colors.gray[400]} />
				</HStack>
			</Pressable>

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
				<Pressable
					className="flex-1 flex-row gap-2 itens-center justify-center rounded-md p-4 border border-border"
					onPress={openRadiusSheet}
				>
					<NavigationIcon size={14} color={colors.gray[950]} />
					<Text>Raio {formatRadiusLabel(appliedFilters.radius)}</Text>
				</Pressable>
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

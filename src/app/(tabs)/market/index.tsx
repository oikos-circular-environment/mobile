import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { ArrowRight, MapPinIcon, Search, Sprout } from "lucide-react-native";
import { Controller, useForm } from "react-hook-form";
import {
	ActivityIndicator,
	KeyboardAvoidingView,
	Pressable,
	ScrollView,
	View,
} from "react-native";
import { CategoryToggle } from "@/components/market/category-toggle";
import { RadiusToggle } from "@/components/market/radius-toggle";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
	FormControl,
	FormControlError,
	FormControlErrorText,
	FormControlLabel,
	FormControlLabelText,
} from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useGeospatial } from "@/contexts/geospatial-context";
import {
	type MarketFilterValues,
	marketFilterSchema,
	useMarket,
} from "@/contexts/market-context";
import { isCompanyOpenNow } from "@/libs/market/is-company-open";

const formatDistance = (meters: number) => {
	if (meters >= 1000) {
		return `${(meters / 1000).toFixed(1).replace(".", ",")} km`;
	}

	return `${Math.round(meters)} m`;
};

export default function MarketScreen() {
	const { currentDate } = useGeospatial();
	const {
		setAppliedFilters,
		isLocationReady,
		companies,
		isPending,
		isFetchingNextPage,
		hasNextPage,
		fetchNextPage,
		isError,
	} = useMarket();

	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<MarketFilterValues>({
		resolver: zodResolver(marketFilterSchema),
		defaultValues: { query: "", radius: "2000", category: undefined },
	});

	const onSubmit = handleSubmit(values => setAppliedFilters(values));

	return (
		<KeyboardAvoidingView
			behavior={process.env.EXPO_OS === "ios" ? "padding" : "height"}
			className="flex-1 bg-white"
		>
			<ScrollView
				className="flex-1 bg-white"
				contentContainerClassName="p-4 pb-8"
				keyboardShouldPersistTaps="handled"
				contentInsetAdjustmentBehavior="automatic"
			>
				<View className="gap-8">
					<VStack className="gap-4">
						<Card className="bg-gray-100 p-4 shadow-none">
							<View className="flex-row items-center gap-4">
								<View className="flex-1 gap-2">
									<View className="flex-row gap-2">
										<View className="p-2 items-center justify-center rounded-lg bg-lime-800">
											<MapPinIcon
												size={12}
												color="#FFFFFF"
												strokeWidth={2.25}
											/>
										</View>
										<Heading>Pontos de coletas</Heading>
									</View>
									<Text className="text-sm text-gray-500" selectable>
										Os resultados são exibidos conforme a sua geolocalização,
										mantendo você como centro. Ajuste os filtros para obter
										melhores resultados.
									</Text>
								</View>
							</View>
						</Card>

						<FormControl isInvalid={!!errors.query} className="gap-2">
							<FormControlLabel className="flex-col items-start">
								<FormControlLabelText>Busca</FormControlLabelText>
								<Text className="text-xs text-gray-400">
									Pesquise por empresas, resíduo ou serviços.
								</Text>
							</FormControlLabel>
							<Controller
								control={control}
								name="query"
								render={({ field: { onChange, onBlur, value } }) => (
									<Input className="rounded-md border-gray-200 bg-white">
										<InputField
											value={value}
											onBlur={onBlur}
											onChangeText={onChange}
											onSubmitEditing={onSubmit}
											returnKeyType="search"
											placeholder="Exemplo: garrafa plástica"
											placeholderTextColor="#9CA3AF"
										/>
										<InputSlot onPress={onSubmit}>
											<InputIcon as={Search} className="text-gray-400" />
										</InputSlot>
									</Input>
								)}
							/>
							{errors.query?.message ? (
								<FormControlError>
									<FormControlErrorText>
										{errors.query.message}
									</FormControlErrorText>
								</FormControlError>
							) : null}
						</FormControl>

						<View className="gap-4">
							<FormControl className="gap-2">
								<FormControlLabel>
									<FormControlLabelText className="text-sm">
										Raio
									</FormControlLabelText>
								</FormControlLabel>
								<Controller
									control={control}
									name="radius"
									render={({ field: { value, onChange } }) => (
										<RadiusToggle value={value} onChange={onChange} />
									)}
								/>
							</FormControl>

							<FormControl className="gap-2">
								<FormControlLabel>
									<FormControlLabelText className="text-sm">
										Categoria
									</FormControlLabelText>
								</FormControlLabel>
								<Controller
									control={control}
									name="category"
									render={({ field: { value, onChange } }) => (
										<CategoryToggle value={value} onChange={onChange} />
									)}
								/>
							</FormControl>
						</View>
					</VStack>

					<View className="gap-4">
						<View className="gap-1">
							<Heading>Ecossistema</Heading>
							<Text className="text-sm text-gray-500">
								Clique na empresa para obter mais informações.
							</Text>
						</View>

						{!isLocationReady ? (
							<Card className="shadow-none bg-gray-50 p-4 gap-1">
								<Text className="text-sm font-semibold text-gray-900">
									Endereço não configurado
								</Text>
								<Text className="text-xs text-gray-500">
									Adicione um endereço no seu perfil para ver empresas próximas
									a você.
								</Text>
							</Card>
						) : isPending ? (
							<Card className="items-center p-6 shadow-none bg-gray-50">
								<ActivityIndicator size="small" color="#3F6212" />
								<Text className="mt-2 text-sm text-gray-500">
									Buscando empresas…
								</Text>
							</Card>
						) : isError ? (
							<Card className="shadow-none bg-gray-50 p-4 gap-1">
								<Text className="text-sm font-semibold text-gray-900">
									Erro ao carregar
								</Text>
								<Text className="text-xs text-gray-500">
									Não foi possível buscar as empresas. Tente novamente.
								</Text>
							</Card>
						) : companies.length === 0 ? (
							<Card className="shadow-none bg-gray-50 p-4">
								<Text className="text-sm text-gray-500">
									Nenhuma empresa encontrada para os filtros aplicados.
								</Text>
							</Card>
						) : (
							<View className="gap-3">
								{companies.map(item => {
									const isOpen = isCompanyOpenNow(
										item.business_hours,
										currentDate,
									);

									return (
										<Link
											key={item.id}
											href={{
												pathname: "/market/[companyId]",
												params: { companyId: item.id },
											}}
											asChild
										>
											<Pressable>
												<Card
													size="sm"
													className="border-0 bg-gray-100 shadow-none"
												>
													<View className="flex-row items-center gap-3">
														<View
															className={`h-8 w-8 items-center justify-center overflow-hidden rounded-[5px] ${item.company_type === "COLLECTOR" ? "bg-gray-200" : "bg-slate-950"}`}
														>
															{item.company_type === "COLLECTOR" ? (
																<Sprout size={16} color="#111827" />
															) : (
																<Text className="text-[10px] font-semibold text-white">
																	{item.corporate_name
																		.split(" ")
																		.slice(0, 2)
																		.map(word => word[0]?.toUpperCase() ?? "")
																		.join("")}
																</Text>
															)}
														</View>

														<View className="min-w-0 flex-1 gap-1">
															<View className="flex-row items-center gap-2">
																<View className="flex-row gap-2 flex-1">
																	<Text className="text-sm font-semibold text-gray-950">
																		{item.corporate_name}
																	</Text>

																	<Badge
																		variant={isOpen ? "default" : "destructive"}
																	>
																		<BadgeText className="text-[8px]">
																			{isOpen ? "Aberto" : "Fechado"}
																		</BadgeText>
																	</Badge>
																</View>

																{item.company_type === "COLLECTOR" ? (
																	<View className="rounded-[5px] bg-lime-800 px-3 py-1">
																		<Text className="text-[8px] text-white">
																			Coletor independente
																		</Text>
																	</View>
																) : null}
															</View>

															<Text className="text-xs leading-4 text-gray-500">
																{item.wastes
																	.map(w => w.name)
																	.slice(0, 4)
																	.join(", ")}
															</Text>

															<View className="flex-row items-center justify-between gap-2">
																<Text className="text-xs text-gray-400">
																	{formatDistance(item.distance_in_meters)}
																</Text>
															</View>
														</View>

														<ArrowRight size={16} color="#111827" />
													</View>
												</Card>
											</Pressable>
										</Link>
									);
								})}

								{hasNextPage ? (
									<Pressable
										className="items-center py-3"
										onPress={() => fetchNextPage()}
										disabled={isFetchingNextPage}
									>
										{isFetchingNextPage ? (
											<ActivityIndicator size="small" color="#3F6212" />
										) : (
											<Text className="text-sm font-semibold text-lime-800">
												Carregar mais
											</Text>
										)}
									</Pressable>
								) : null}
							</View>
						)}
					</View>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

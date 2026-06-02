import { useQuery } from "@tanstack/react-query";
import { BuildingIcon, CheckIcon, SearchIcon } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Image, TouchableOpacity, View } from "react-native";
import { colors } from "@/components/style/colors";
import {
	BottomSheet,
	BottomSheetBackdrop,
	BottomSheetDragIndicator,
	BottomSheetFlatList,
	BottomSheetPortal,
	type BottomSheetRef,
	BottomSheetTextInput,
} from "@/components/ui/bottomsheet";
import { Text } from "@/components/ui/text";
import type { GetV1CompaniesResponse } from "@/libs/oikos-sdk";
import { getV1Companies } from "@/libs/oikos-sdk";

export type Company = GetV1CompaniesResponse["companies"][number];

type CompanyPickerBottomSheetProps = {
	isOpen: boolean;
	onClose: () => void;
	onSelect: (company: Company) => void;
	selectedCompanyId?: string | null;
};

export function CompanyPickerBottomSheet({
	isOpen,
	onClose,
	onSelect,
	selectedCompanyId,
}: CompanyPickerBottomSheetProps) {
	const ref = useRef<BottomSheetRef>(null);
	const [search, setSearch] = useState("");

	useEffect(() => {
		if (isOpen) {
			ref.current?.open();
		} else {
			ref.current?.close();
		}
	}, [isOpen]);

	const { data } = useQuery({
		queryKey: ["user-companies"],
		queryFn: async () => {
			const res = await getV1Companies();
			return res.data;
		},
		enabled: isOpen,
	});

	const companies = data?.companies ?? [];
	const filtered = search.trim()
		? companies.filter(c =>
				(c.business_name ?? c.corporate_name)
					.toLowerCase()
					.includes(search.toLowerCase()),
			)
		: companies;

	return (
		<BottomSheet ref={ref} onClose={onClose}>
			<BottomSheetPortal
				snapPoints={["60%"]}
				backdropComponent={BottomSheetBackdrop}
				handleComponent={BottomSheetDragIndicator}
			>
				<View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
					<Text
						style={{
							fontSize: 16,
							fontWeight: "700",
							color: colors.gray[900],
							marginBottom: 12,
						}}
					>
						Selecionar empresa
					</Text>
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
							gap: 8,
							borderRadius: 12,
							borderWidth: 1,
							borderColor: colors.gray[200],
							backgroundColor: colors.gray[50],
							paddingHorizontal: 12,
						}}
					>
						<SearchIcon size={16} color={colors.gray[400]} strokeWidth={2} />
						<BottomSheetTextInput
							value={search}
							onChangeText={setSearch}
							placeholder="Buscar empresa..."
							placeholderTextColor={colors.gray[400]}
							style={{
								flex: 1,
								paddingVertical: 12,
								fontSize: 14,
								color: colors.gray[900],
							}}
						/>
					</View>
				</View>

				<BottomSheetFlatList
					data={filtered}
					keyExtractor={item => item.id}
					contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
					ItemSeparatorComponent={() => (
						<View style={{ height: 1, backgroundColor: colors.gray[100] }} />
					)}
					renderItem={({ item }) => {
						const name = item.business_name ?? item.corporate_name;
						const isSelected = selectedCompanyId === item.id;
						return (
							<TouchableOpacity
								onPress={() => {
									onSelect(item);
									onClose();
								}}
								style={{
									flexDirection: "row",
									alignItems: "center",
									gap: 12,
									paddingVertical: 12,
								}}
								activeOpacity={0.7}
							>
								{item.avatar?.url ? (
									<Image
										source={{ uri: item.avatar.url }}
										style={{ width: 40, height: 40, borderRadius: 20 }}
									/>
								) : (
									<View
										style={{
											width: 40,
											height: 40,
											borderRadius: 20,
											backgroundColor: colors.gray[100],
											alignItems: "center",
											justifyContent: "center",
										}}
									>
										<BuildingIcon
											size={16}
											color={colors.gray[500]}
											strokeWidth={2}
										/>
									</View>
								)}
								<View style={{ flex: 1 }}>
									<Text
										style={{
											fontWeight: "600",
											color: isSelected ? colors.lime[800] : colors.gray[800],
										}}
									>
										{name}
									</Text>
									<Text style={{ fontSize: 12, color: colors.gray[400] }}>
										{item.company_type}
									</Text>
								</View>
								{isSelected && (
									<CheckIcon
										size={18}
										color={colors.lime[800]}
										strokeWidth={2.5}
									/>
								)}
							</TouchableOpacity>
						);
					}}
				/>
			</BottomSheetPortal>
		</BottomSheet>
	);
}

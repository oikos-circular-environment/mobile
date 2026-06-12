import BottomSheet, {
	BottomSheetBackdrop,
	type BottomSheetBackdropProps,
	BottomSheetView,
} from "@gorhom/bottom-sheet";
import type * as Location from "expo-location";
import { CheckIcon, MapPinIcon, User2Icon } from "lucide-react-native";
import { useCallback } from "react";
import { Pressable, View } from "react-native";
import { colors } from "@/components/style/colors";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { SkeletonText } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAuthContext } from "@/contexts/auth-context";
import { useGeospatial } from "@/contexts/geospatial-context";
import { type LocationSource, useMarket } from "@/contexts/market-context";
import type { Address } from "@/libs/types/address";

function formatGeocodedAddress(addr: Location.LocationGeocodedAddress): string {
	const streetPart = [addr.streetNumber, addr.street].filter(Boolean).join(" ");
	return [streetPart, addr.district, addr.city, addr.region]
		.filter(Boolean)
		.join(", ");
}

function formatProfileAddress(addr: Address): string {
	const streetPart = [addr.street, addr.number].filter(Boolean).join(", ");
	const cityPart = addr.state_code
		? `${addr.city} - ${addr.state_code}`
		: addr.city;
	return [streetPart, addr.district, cityPart].filter(Boolean).join(", ");
}

type OptionRowProps = {
	icon: React.ReactNode;
	iconBg: string;
	title: string;
	address: string | undefined;
	lat: number | null | undefined;
	lon: number | null | undefined;
	isSelected: boolean;
	onPress: () => void;
};

function OptionRow({
	icon,
	iconBg,
	title,
	address,
	lat,
	lon,
	isSelected,
	onPress,
}: OptionRowProps) {
	return (
		<Pressable onPress={onPress}>
			<HStack
				className={`gap-3 p-3 rounded-lg items-start ${isSelected ? "bg-lime-50 border border-lime-800" : "bg-gray-50"}`}
			>
				<View
					className="p-2 rounded-lg items-center justify-center"
					style={{ backgroundColor: iconBg }}
				>
					{icon}
				</View>
				<VStack className="flex-1 gap-1">
					<Text className="text-sm font-semibold text-gray-900">{title}</Text>
					{address !== undefined ? (
						<Text className="text-xs text-gray-500" numberOfLines={2}>
							{address}
						</Text>
					) : (
						<SkeletonText className="h-3" />
					)}
					<HStack className="gap-3">
						<Text className="text-xs text-gray-400">
							{lat != null ? lat.toFixed(6) : "—"}
						</Text>
						<Text className="text-xs text-gray-400">
							{lon != null ? lon.toFixed(6) : "—"}
						</Text>
					</HStack>
				</VStack>
				{isSelected && <CheckIcon size={16} color={colors.lime[800]} />}
			</HStack>
		</Pressable>
	);
}

export function LocationSourceBottomSheet() {
	const { locationSheetRef, locationSource, setLocationSource } = useMarket();
	const { location, addresses } = useGeospatial();
	const { user, isAuthenticated } = useAuthContext();

	const currentAddressText = addresses[0]
		? formatGeocodedAddress(addresses[0])
		: undefined;
	const currentLat = location?.coords.latitude;
	const currentLon = location?.coords.longitude;

	const profileAddress = user?.profile?.address ?? null;
	const profileAddressText = profileAddress
		? formatProfileAddress(profileAddress)
		: null;
	const profileLat = profileAddress?.latitude;
	const profileLon = profileAddress?.longitude;
	const profileSelectable = profileLat != null && profileLon != null;

	const disabledProfileMessage = !isAuthenticated
		? "Cadastre-se para liberar mais funcionalidades."
		: !profileAddress
			? "Adicione um endereço no seu perfil."
			: "Endereço sem coordenadas cadastradas.";

	const selectOption = (source: LocationSource) => {
		setLocationSource(source);
		locationSheetRef.current?.close();
	};

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
		<BottomSheet
				ref={locationSheetRef}
				index={-1}
				snapPoints={["44%"]}
				enablePanDownToClose
				backdropComponent={backdropComponent}
			>
				<BottomSheetView style={{ padding: 16 }}>
					<Heading size="sm" className="text-base text-gray-900">
						Selecionar localização
					</Heading>

					<OptionRow
						icon={<MapPinIcon size={14} color={colors.white} />}
						iconBg={colors.lime[800]}
						title="Localização atual"
						address={currentAddressText}
						lat={currentLat}
						lon={currentLon}
						isSelected={locationSource === "current"}
						onPress={() => selectOption("current")}
					/>

					{profileSelectable ? (
						<OptionRow
							icon={<User2Icon size={14} color={colors.white} />}
							iconBg={colors.lime[800]}
							title="Endereço do perfil"
							address={profileAddressText ?? ""}
							lat={profileLat}
							lon={profileLon}
							isSelected={locationSource !== "current"}
							onPress={() => selectOption("profile")}
						/>
					) : (
						<HStack className="gap-3 p-3 rounded-lg items-center bg-gray-50">
							<View
								className="p-2 rounded-lg items-center justify-center"
								style={{ backgroundColor: colors.gray[300] }}
							>
								<User2Icon size={14} color={colors.white} />
							</View>
							<VStack className="flex-1 gap-1">
								<Text className="text-sm font-semibold text-gray-400">
									Endereço do perfil
								</Text>
								<Text className="text-xs text-gray-400">
									{disabledProfileMessage}
								</Text>
							</VStack>
						</HStack>
					)}
				</BottomSheetView>
		</BottomSheet>
	);
}

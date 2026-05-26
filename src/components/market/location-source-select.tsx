import type * as Location from "expo-location";
import {
	CheckIcon,
	ChevronDownIcon,
	LocateIcon,
	MapPinIcon,
} from "lucide-react-native";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { colors } from "@/components/style/colors";
import {
	BottomSheet,
	BottomSheetBackdrop,
	BottomSheetDragIndicator,
	BottomSheetPortal,
	type BottomSheetRef,
	BottomSheetScrollView,
} from "@/components/ui/bottomsheet";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
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

function CoordRow({
	lat,
	lon,
}: {
	lat: number | null | undefined;
	lon: number | null | undefined;
}) {
	return (
		<HStack className="gap-3">
			<Text className="text-xs text-gray-400">
				{lat != null ? lat.toFixed(6) : "—"}
			</Text>
			<Text className="text-xs text-gray-400">
				{lon != null ? lon.toFixed(6) : "—"}
			</Text>
		</HStack>
	);
}

export function LocationSourceSelect() {
	const { locationSource, setLocationSource } = useMarket();
	const { location, addresses } = useGeospatial();
	const { user, isAuthenticated } = useAuthContext();
	const [isOpen, setIsOpen] = useState(false);
	const ref = useRef<BottomSheetRef>(null);

	useEffect(() => {
		if (isOpen) ref.current?.open();
		else ref.current?.close();
	}, [isOpen]);

	const currentAddressText = addresses[0]
		? formatGeocodedAddress(addresses[0])
		: "Obtendo endereço...";
	const currentLat = location?.coords.latitude;
	const currentLon = location?.coords.longitude;

	const profileAddress = user?.profile?.address ?? null;
	const profileAddressText = profileAddress
		? formatProfileAddress(profileAddress)
		: null;
	const profileLat = profileAddress?.latitude;
	const profileLon = profileAddress?.longitude;
	const profileSelectable = profileLat != null && profileLon != null;

	const isCurrentSelected = locationSource === "current";
	const displayAddress = isCurrentSelected
		? currentAddressText
		: (profileAddressText ?? "Endereço não cadastrado");
	const displayLat = isCurrentSelected ? currentLat : profileLat;
	const displayLon = isCurrentSelected ? currentLon : profileLon;

	const disabledProfileMessage = !isAuthenticated
		? "Cadastre-se para liberar mais funcionalidades."
		: !profileAddress
			? "Adicione um endereço no seu perfil."
			: "Endereço sem coordenadas cadastradas.";

	const selectOption = (source: LocationSource) => {
		setLocationSource(source);
		setIsOpen(false);
	};

	return (
		<>
			<Text className="text-sm font-semibold">Localização</Text>
			<Pressable onPress={() => setIsOpen(true)}>
				<HStack className="gap-3 items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
					<View
						className="p-2 rounded-lg items-center justify-center"
						style={{ backgroundColor: colors.lime[800] }}
					>
						{isCurrentSelected ? (
							<LocateIcon size={12} color={colors.white} />
						) : (
							<MapPinIcon size={12} color={colors.white} />
						)}
					</View>
					<VStack className="flex-1 gap-0.5">
						<Text className="text-sm text-gray-800" numberOfLines={1}>
							{displayAddress}
						</Text>
						<CoordRow lat={displayLat} lon={displayLon} />
					</VStack>
					<ChevronDownIcon size={14} color={colors.gray[400]} />
				</HStack>
			</Pressable>

			<BottomSheet ref={ref} onClose={() => setIsOpen(false)}>
				<BottomSheetPortal
					snapPoints={["44%"]}
					backdropComponent={BottomSheetBackdrop}
					handleComponent={BottomSheetDragIndicator}
				>
					<BottomSheetScrollView
						contentContainerStyle={{
							gap: 12,
							paddingHorizontal: 16,
							paddingBottom: 32,
						}}
					>
						<Heading size="sm" className="text-base text-gray-900">
							Selecionar localização
						</Heading>

						<OptionRow
							icon={<LocateIcon size={14} color={colors.white} />}
							iconBg={colors.lime[800]}
							title="Localização atual"
							address={currentAddressText}
							lat={currentLat}
							lon={currentLon}
							isSelected={isCurrentSelected}
							onPress={() => selectOption("current")}
						/>

						{profileSelectable ? (
							<OptionRow
								icon={<MapPinIcon size={14} color={colors.white} />}
								iconBg={colors.gray[700]}
								title="Endereço do perfil"
								address={profileAddressText ?? ""}
								lat={profileLat}
								lon={profileLon}
								isSelected={!isCurrentSelected}
								onPress={() => selectOption("profile")}
							/>
						) : (
							<DisabledProfileRow message={disabledProfileMessage} />
						)}
					</BottomSheetScrollView>
				</BottomSheetPortal>
			</BottomSheet>
		</>
	);
}

type OptionRowProps = {
	icon: ReactNode;
	iconBg: string;
	title: string;
	address: string;
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
					<Text className="text-xs text-gray-500" numberOfLines={2}>
						{address}
					</Text>
					<CoordRow lat={lat} lon={lon} />
				</VStack>
				{isSelected && <CheckIcon size={16} color={colors.lime[800]} />}
			</HStack>
		</Pressable>
	);
}

function DisabledProfileRow({ message }: { message: string }) {
	return (
		<HStack className="gap-3 p-3 rounded-lg items-center bg-gray-50">
			<View
				className="p-2 rounded-lg items-center justify-center"
				style={{ backgroundColor: colors.gray[300] }}
			>
				<MapPinIcon size={14} color={colors.white} />
			</View>
			<VStack className="flex-1 gap-1">
				<Text className="text-sm font-semibold text-gray-400">
					Endereço do perfil
				</Text>
				<Text className="text-xs text-gray-400">{message}</Text>
			</VStack>
		</HStack>
	);
}

import { useState } from "react";
import { View } from "react-native";
import {
	type GooglePlaceDetail,
	GooglePlacesAutocomplete,
} from "react-native-google-places-autocomplete";
import { colors } from "@/components/style/colors";
import { Text } from "@/components/ui/text";

export type GooglePlacesAddressFields = {
	street: string;
	streetNumber: string;
	district: string;
	city: string;
	region: string;
	postalCode: string;
	latitude: string;
	longitude: string;
};

type Props = {
	onSelect: (fields: GooglePlacesAddressFields) => void;
};

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

function parseDetail(detail: GooglePlaceDetail): GooglePlacesAddressFields {
	const get = (
		type: string,
		nameType: "long_name" | "short_name" = "long_name",
	) =>
		detail.address_components.find(c => c.types.includes(type as never))?.[
			nameType
		] ?? "";

	const rawPostcode = get("postal_code");
	const postalCode = rawPostcode
		.replace(/\D/g, "")
		.replace(/^(\d{5})(\d{1,3})$/, "$1-$2");

	return {
		street: get("route"),
		streetNumber: get("street_number"),
		district: get("sublocality_level_1") || get("sublocality"),
		city: get("administrative_area_level_2"),
		region: get("administrative_area_level_1", "short_name"),
		postalCode,
		latitude: String(detail.geometry.location.lat),
		longitude: String(detail.geometry.location.lng),
	};
}

export function GooglePlacesInput({ onSelect }: Props) {
	const [apiError, setApiError] = useState<string | null>(null);

	if (__DEV__) {
		console.log(
			"[GooglePlacesInput] API_KEY:",
			API_KEY ? `${API_KEY.slice(0, 8)}…` : "MISSING",
		);
	}

	return (
		<View className="gap-1">
			<GooglePlacesAutocomplete
				placeholder="Buscar endereço..."
				fetchDetails
				onPress={(_, detail) => {
					if (!detail) return;
					setApiError(null);
					onSelect(parseDetail(detail));
				}}
				onFail={error => {
					const msg = typeof error === "string" ? error : JSON.stringify(error);
					console.error("[GooglePlacesInput] onFail:", msg);
					setApiError(msg);
				}}
				onNotFound={() => {
					console.warn("[GooglePlacesInput] onNotFound: nenhum resultado");
				}}
				query={{
					key: API_KEY,
					language: "pt-BR",
					components: "country:br",
					types: "address",
				}}
				keyboardShouldPersistTaps="always"
				styles={{
					container: { flex: 0 },
					textInputContainer: {
						borderWidth: 1,
						borderColor: colors.gray[200],
						borderRadius: 6,
						backgroundColor: "white",
						overflow: "hidden",
					},
					textInput: {
						height: 36,
						fontSize: 14,
						color: colors.gray[800],
						paddingHorizontal: 12,
						backgroundColor: "white",
						marginBottom: 0,
					},
					listView: {
						borderWidth: 1,
						borderColor: colors.gray[200],
						borderRadius: 6,
						marginTop: 2,
						backgroundColor: "white",
					},
					row: {
						paddingHorizontal: 12,
						paddingVertical: 10,
						backgroundColor: "white",
					},
					separator: {
						height: 1,
						backgroundColor: colors.gray[100],
					},
					description: {
						fontSize: 14,
						color: colors.gray[800],
					},
					poweredContainer: {
						paddingVertical: 4,
						paddingHorizontal: 12,
					},
				}}
			/>
			{apiError ? (
				<Text className="text-xs text-destructive">{apiError}</Text>
			) : (
				<Text className="text-xs text-muted-foreground">
					Ex: "Rua A, 123, Bairro Itambé, São Paulo"
				</Text>
			)}
		</View>
	);
}

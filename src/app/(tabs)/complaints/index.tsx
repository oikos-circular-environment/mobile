"use client";

import { router } from "expo-router";
import { Plus, ShieldIcon } from "lucide-react-native";
import { ScrollView, View } from "react-native";
import { ComplaintCard } from "@/components/complaints/complaint-card";
import { ComplaintPainel } from "@/components/complaints/complaint-painel";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import type { Complaint } from "@/libs/types/complaint";

const complaintPainelValues = {
	total: 10,
	resolved: 4,
	pending: 5,
	canceled: 1,
};

const complaint: Complaint[] = [
	{
		id: "complaint-1",
		capture: {
			type: "photo",
			object: {
				uri: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=960&q=80",
			},
		},
		date: "2026-04-09T14:50:26.000Z",
		geospatial: {
			heading: {
				accuracy: 3,
				trueHeading: 124.5,
				magHeading: 120.3,
			},
			location: {
				coords: {
					accuracy: 5,
					altitude: 320,
					latitude: -16.4708,
					longitude: -54.6354,
					altitudeAccuracy: 8,
					heading: 124.5,
					speed: 0,
				},
				timestamp: 1744210226000,
				mocked: true,
			},
			addresses: {
				streetNumber: "144",
				street: "Rua A",
				city: "Rondonópolis",
				country: "Brasil",
				postalCode: "78700-000",
				region: "Mato Grosso",
				subregion: "Centro-Sul Mato-grossense",
				district: "São Cristóvão",
				formattedAddress:
					"Rua A, 144, São Cristóvão, Rondonópolis - MT, 78700-000",
				isoCountryCode: "BR",
				name: "Ponto de descarte irregular",
				timezone: "America/Cuiaba",
			},
		},
		type: "irregular_disposal",
		observation: "Acúmulo de entulho e resíduos em via pública.",
		created_at: "2026-04-09T14:50:26.000Z",
		updated_at: "2026-04-09T14:50:26.000Z",
		status: "pending",
	},
];

export default function ComplaintsScreen() {
	return (
		<ScrollView
			className="flex-1 bg-white"
			contentInsetAdjustmentBehavior="automatic"
			contentContainerClassName="gap-4 px-4 py-4 pb-8"
		>
			<Card className=" bg-gray-100 p-4 shadow-none">
				<View className="flex-row items-center gap-4">
					<View className="flex-1 gap-1">
						<Heading>Denunciar</Heading>
						<Text className="text-sm text-gray-500" selectable>
							Faça a sua denúncia anônima e gratuita. Ajude a manter o meio
							ambiente livre do descarte irregular.
						</Text>
					</View>

					<View className="size-14 items-center justify-center rounded-lg bg-lime-800">
						<ShieldIcon size={24} color="#FFFFFF" strokeWidth={2.25} />
					</View>
				</View>
			</Card>

			<Button
				size="lg"
				onPress={() => router.push("/(tabs)/complaints/(create)/camera")}
			>
				<ButtonText className="flex-1 text-center font-semibold text-white">
					Nova Denúncia
				</ButtonText>
				<ButtonIcon as={Plus} className="text-white" height={18} width={18} />
			</Button>

			<View className="justify-center">
				<Heading>Painel de Denúncias</Heading>
			</View>

			<ComplaintPainel panel={complaintPainelValues} />

			<View>
				<Heading>Denúncias</Heading>
			</View>

			<View className="gap-4">
				{complaint.map((item, index) => (
					<ComplaintCard key={index} complaint={item} />
				))}
			</View>
		</ScrollView>
	);
}

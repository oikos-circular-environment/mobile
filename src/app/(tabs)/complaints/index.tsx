"use client";

import { router, useFocusEffect } from "expo-router";
import { Plus, ShieldIcon } from "lucide-react-native";
import { useCallback } from "react";
import { ScrollView, View } from "react-native";
import {
	ComplaintCard,
	ComplaintCardSkeleton,
} from "@/components/complaints/complaint-card";
import { ComplaintPainel } from "@/components/complaints/complaint-painel";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { useComplaintsContext } from "@/contexts/complaints-context";

export default function ComplaintsScreen() {
	const { filteredComplaints, isLoadingComplaints, refetchAll } =
		useComplaintsContext();

	useFocusEffect(
		useCallback(() => {
			refetchAll();
		}, [refetchAll]),
	);

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
				<Heading>Dashboard</Heading>
				<Text>
					Os campos abaixo servem como filtros, clique sobre eles para filtrar
					sua lista.
				</Text>
			</View>

			<ComplaintPainel />

			<View>
				<Heading>Denúncias</Heading>
			</View>

			<View className="gap-4">
				{isLoadingComplaints ? (
					<>
						<ComplaintCardSkeleton />
						<ComplaintCardSkeleton />
						<ComplaintCardSkeleton />
					</>
				) : filteredComplaints.length === 0 ? (
					<Card className="items-center gap-2 border-gray-100 p-6 shadow-none">
						<ShieldIcon size={32} color="#9CA3AF" strokeWidth={1.5} />
						<Text className="text-center text-sm text-gray-500">
							Nenhuma denúncia encontrada.
						</Text>
					</Card>
				) : (
					filteredComplaints.map(complaint => (
						<ComplaintCard key={complaint.id} complaint={complaint} />
					))
				)}
			</View>
		</ScrollView>
	);
}

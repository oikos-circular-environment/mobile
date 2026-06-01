"use client";

import {
	ShieldAlertIcon,
	ShieldCheckIcon,
	ShieldIcon,
	ShieldQuestionMarkIcon,
	ShieldXIcon,
} from "lucide-react-native";
import type { ComponentType } from "react";
import { View } from "react-native";
import { colors } from "@/components/style/colors";
import { Card } from "@/components/ui/card";
import { Grid, GridItem } from "@/components/ui/grid";
import { Heading } from "@/components/ui/heading";
import { Pressable } from "@/components/ui/pressable";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import type { ApiComplaintStatus } from "@/stores/complaints-store";
import { useComplaintsStore } from "@/stores/complaints-store";

type PanelItem = {
	status: ApiComplaintStatus | null;
	label: string;
	count: number;
	iconColor: string;
	iconBgColor: string;
	activeBg: string;
	activeBorder: string;
	Icon: ComponentType<{ size: number; color: string; strokeWidth?: number }>;
};

export function ComplaintPainel() {
	const dashboard = useComplaintsStore(s => s.dashboard);
	const activeFilter = useComplaintsStore(s => s.activeFilter);
	const setActiveFilter = useComplaintsStore(s => s.setActiveFilter);

	if (!dashboard) {
		return (
			<View className="gap-2">
				<Skeleton startColor="bg-gray-200" className="w-full h-20 rounded-xl" />
				<View className="flex-row flex-wrap gap-2">
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton
							key={i}
							startColor="bg-gray-200"
							className="w-[48%] h-20 rounded-xl"
						/>
					))}
				</View>
			</View>
		);
	}

	const items: PanelItem[] = [
		{
			status: null,
			label: "Total de denúncias",
			count: dashboard?.total ?? 0,
			iconColor: colors.gray[400],
			iconBgColor: "bg-gray-100",
			activeBg: "bg-gray-100",
			activeBorder: "border-gray-400",
			Icon: ShieldIcon,
		},
		{
			status: "OPEN",
			label: "Abertas",
			count: dashboard?.open ?? 0,
			iconColor: colors.sky[500],
			iconBgColor: "bg-sky-100",
			activeBg: "bg-sky-100",
			activeBorder: "border-sky-300",
			Icon: ShieldIcon,
		},
		{
			status: "IN_PROGRESS",
			label: "Em andamento",
			count: dashboard?.pending ?? 0,
			iconColor: colors.amber[400],
			iconBgColor: "bg-amber-100",
			activeBg: "bg-amber-100",
			activeBorder: "border-amber-300",
			Icon: ShieldQuestionMarkIcon,
		},
		{
			status: "RESOLVED",
			label: "Resolvidas",
			count: dashboard?.resolved ?? 0,
			iconColor: colors.lime[800],
			iconBgColor: "bg-lime-100",
			activeBg: "bg-lime-100",
			activeBorder: "border-lime-600",
			Icon: ShieldCheckIcon,
		},
		{
			status: "CANCELED",
			label: "Canceladas",
			count: dashboard?.canceled ?? 0,
			iconColor: colors.red[700],
			iconBgColor: "bg-red-100",
			activeBg: "bg-red-100",
			activeBorder: "border-red-300",
			Icon: ShieldXIcon,
		},
		{
			status: "REJECTED",
			label: "Rejeitadas",
			count: dashboard?.rejected ?? 0,
			iconColor: colors.orange[600],
			iconBgColor: "bg-orange-100",
			activeBg: "bg-orange-100",
			activeBorder: "border-orange-300",
			Icon: ShieldAlertIcon,
		},
	];

	return (
		<Grid className="gap-2" _extra={{ className: "grid-cols-2" }}>
			{items.map(item => {
				const isActive =
					item.status === null
						? activeFilter === null
						: activeFilter === item.status;
				const colSpan = "col-span-1";
				const StatusIcon = item.Icon;

				return (
					<GridItem
						key={item.status ?? "total"}
						_extra={{ className: colSpan }}
					>
						<Pressable
							onPress={() => setActiveFilter(isActive ? null : item.status)}
							className="flex-1"
						>
							<Card
								className={`items-start gap-2 shadow-none border ${
									isActive
										? `${item.activeBg} ${item.activeBorder}`
										: "bg-white border-gray-200"
								}`}
							>
								<View className="flex-row items-center w-full">
									<View className="flex-1">
										<Heading>{item.count}</Heading>
									</View>
									<View
										className={`p-1 items-center justify-center rounded-md ${item.iconBgColor}`}
									>
										<StatusIcon size={16} color={item.iconColor} />
									</View>
								</View>
								<Text className="text-sm text-gray-500">{item.label}</Text>
							</Card>
						</Pressable>
					</GridItem>
				);
			})}
		</Grid>
	);
}

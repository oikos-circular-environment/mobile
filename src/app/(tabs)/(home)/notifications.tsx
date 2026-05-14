import { format, isToday, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Stack } from "expo-router";
import { CheckIcon } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, View } from "react-native";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import {
	type NotificationItem,
	useNotifications,
} from "@/contexts/notification-context";

type NotificationSection = {
	title: string;
	items: NotificationItem[];
};

function NotificationCard({
	item,
	onPress,
}: {
	item: NotificationItem;
	onPress: () => void;
}) {
	return (
		<Pressable onPress={onPress}>
			<Card className="gap-2 bg-secondary/40 shadow-none">
				<View className="flex flex-row items-start justify-between gap-2">
					<Heading className="flex-1 text-xl">{item.title}</Heading>
					{item.isRead ? (
						<View className="size-2 rounded-full bg-green-500" />
					) : null}
				</View>

				<View className="flex flex-row gap-3">
					{item.imageUrl ? (
						<Image
							source={{ uri: item.imageUrl }}
							className="size-12 rounded-md"
							resizeMode="cover"
						/>
					) : null}

					<Text className="flex-1 text-muted-foreground" numberOfLines={4}>
						{item.message}
					</Text>
				</View>

				<Text className="text-xs text-muted-foreground/80">
					{format(item.createdAt, "d 'de' MMM, HH:mm", { locale: ptBR })}
				</Text>
			</Card>
		</Pressable>
	);
}

export default function NotificationsScreen() {
	const { notifications, markAsRead } = useNotifications();
	const [showReadOnly, setShowReadOnly] = useState(false);

	const filteredNotifications = useMemo(
		() =>
			showReadOnly
				? notifications.filter(notification => notification.isRead)
				: notifications,
		[notifications, showReadOnly],
	);

	const sections = useMemo<NotificationSection[]>(() => {
		const nowMinus7 = subDays(new Date(), 7);
		const nowMinus30 = subDays(new Date(), 30);

		return [
			{
				title: "Hoje",
				items: filteredNotifications.filter(notification =>
					isToday(notification.createdAt),
				),
			},
			{
				title: "Ultimos 7 dias",
				items: filteredNotifications.filter(
					notification =>
						!isToday(notification.createdAt) &&
						notification.createdAt >= nowMinus7,
				),
			},
			{
				title: "Ultimos 30 dias",
				items: filteredNotifications.filter(
					notification =>
						notification.createdAt < nowMinus7 &&
						notification.createdAt >= nowMinus30,
				),
			},
		].filter(section => section.items.length > 0);
	}, [filteredNotifications]);

	return (
		<>
			<Stack.Screen options={{ title: "Notificacoes" }} />
			<ScrollView className="flex-1 bg-white p-4">
				<View className="gap-4 pb-8">
					<View className="flex flex-row items-center justify-between">
						<Heading size="xl">Notificacoes</Heading>
						<Button
							variant="secondary"
							size="sm"
							onPress={() => setShowReadOnly(current => !current)}
						>
							<ButtonText>Lidas</ButtonText>
							<ButtonIcon as={CheckIcon} />
						</Button>
					</View>

					{sections.map(section => (
						<View key={section.title} className="gap-3">
							<Heading>{section.title}</Heading>
							{section.items.map(notification => (
								<NotificationCard
									key={notification.id}
									item={notification}
									onPress={() => markAsRead(notification.id)}
								/>
							))}
						</View>
					))}
				</View>
			</ScrollView>
		</>
	);
}

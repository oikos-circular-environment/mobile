import { Image } from "expo-image";
import { Link } from "expo-router";
import { ArrowRight, SettingsIcon, UserRoundPen } from "lucide-react-native";
import { Pressable, View } from "react-native";
import OikosLogo from "@/assets/icons/icon.png";
import { colors } from "@/components/style/colors";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { useAuthContext } from "@/contexts/auth-context";

type HomeUserCardProps = {
	onOpenSettings: () => void;
};

export function HomeUserCard({ onOpenSettings }: HomeUserCardProps) {
	const { user } = useAuthContext();

	if (user === null) {
		return (
			<Link href="/(tabs)/(home)/profile" asChild>
				<Pressable>
					<Card className="flex flex-row items-center gap-4 shadow-none border border-lime-700 bg-lime-50">
						<View className="w-16 h-16 rounded-lg bg-lime-800 items-center justify-center">
							<UserRoundPen size={18} color={colors.white} />
						</View>
						<View className="flex-1">
							<Heading>Finalize seu cadastro</Heading>
							<Text className="text-gray-500">
								Complete suas informações para acessar todos os recursos.
							</Text>
						</View>
						<ArrowRight size={16} color={colors.lime[800]} />
					</Card>
				</Pressable>
			</Link>
		);
	}

	return (
		<Card className="flex flex-row gap-4 shadow-none">
			<Link href="/(tabs)/(home)/profile" asChild>
				<Pressable className="flex flex-1 flex-row gap-4">
					<Image
						source={
							user.profile.profile_image
								? user.profile.profile_image.url
								: OikosLogo
						}
						style={{ width: 40, height: 40, borderRadius: 4 }}
					/>
					<View className="flex flex-col flex-1">
						<Heading numberOfLines={1}>{user.profile.display_name}</Heading>
						<Text className="text-muted-foreground">
							{`${user.profile.address?.street}, ${user.profile.address?.number}`}
						</Text>
					</View>
				</Pressable>
			</Link>
			<Button
				variant="secondary"
				size="icon"
				className="size-12"
				onPress={onOpenSettings}
			>
				<SettingsIcon size={18} color={colors.gray[700]} />
			</Button>
		</Card>
	);
}

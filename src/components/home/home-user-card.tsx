import { Image } from "expo-image";
import { Link } from "expo-router";
import {
	ArrowRight,
	SlidersHorizontalIcon,
	UserRoundPen,
} from "lucide-react-native";
import { Pressable, View } from "react-native";
import OikosLogo from "@/assets/icons/icon.png";
import { colors } from "@/components/style/colors";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { useAuthContext } from "@/contexts/auth-context";
import { getAuthenticatedImageHeaders } from "@/libs/api/oikos-api";

type HomeUserCardProps = {
	onOpenSettings: () => void;
};

export function HomeUserCard({ onOpenSettings }: HomeUserCardProps) {
	const { user } = useAuthContext();

	if (user === null) {
		return (
			<Link href="/(tabs)/(home)/profile" asChild>
				<Pressable className="flex-row items-center gap-4 rounded-2xl border border-white/40 bg-white/30 p-4 shadow-sm">
					<View className="w-16 h-16 rounded-lg bg-lime-800 items-center justify-center">
						<UserRoundPen size={18} color={colors.white} />
					</View>
					<View className="flex-1">
						<Heading>Finalize seu cadastro</Heading>
						<Text className="text-gray-600">
							Complete suas informações para acessar todos os recursos.
						</Text>
					</View>
					<ArrowRight size={16} color={colors.lime[800]} />
				</Pressable>
			</Link>
		);
	}

	return (
		<View className="flex-row items-center gap-3 rounded-2xl border border-white/40 bg-white/30 p-3 shadow-sm">
			<Link href="/(tabs)/(home)/profile" asChild>
				<Pressable className="flex flex-1 flex-row items-center gap-3">
					<Image
						source={
							user.profile.profile_image
								? {
										uri: user.profile.profile_image.url,
										headers: getAuthenticatedImageHeaders(),
									}
								: OikosLogo
						}
						style={{ width: 44, height: 44, borderRadius: 10 }}
					/>
					<View className="flex flex-col flex-1">
						<Heading size="sm" numberOfLines={1}>
							{user.profile.display_name}
						</Heading>
						<Text className="text-gray-600">
							{`${user.profile.address?.street}, ${user.profile.address?.number}`}
						</Text>
					</View>
				</Pressable>
			</Link>
			<Pressable
				onPress={onOpenSettings}
				className="w-11 h-11 items-center justify-center rounded-full bg-white/60"
			>
				<SlidersHorizontalIcon size={18} color={colors.gray[700]} />
			</Pressable>
		</View>
	);
}

import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { RecycleIcon, RepeatIcon, TrendingDownIcon } from "lucide-react-native";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NatureImage from "@/assets/images/nature.png";
import {
	FloatingGlassBadge,
	type FloatingGlassBadgeItem,
} from "@/components/home/floating-glass-badge";
import { HomeHeaderSkeleton } from "@/components/home/home-header-skeleton";
import { HomeUserCard } from "@/components/home/home-user-card";
import { SlideToLoginButton } from "@/components/home/slide-to-login-button";
import { Text } from "@/components/ui/text";

interface HomeHeroProps {
	isAuthenticated: boolean;
	isLoading: boolean;
	onOpenSettings: () => void;
	onPressLogin: () => void;
}

const HERO_BADGE_ITEMS: FloatingGlassBadgeItem[] = [
	{ icon: RepeatIcon, label: "Reuse" },
	{ icon: TrendingDownIcon, label: "Reduze" },
	{ icon: RecycleIcon, label: "Recicle" },
];

export function HomeHero({
	isAuthenticated,
	isLoading,
	onOpenSettings,
	onPressLogin,
}: HomeHeroProps) {
	const insets = useSafeAreaInsets();
	const { width } = useWindowDimensions();

	const wordmarkSize = Math.round(width * 0.235);
	const wordmarkLineHeight = Math.round(wordmarkSize * 0.92);
	const treeSize = Math.round(wordmarkSize * 2.6);
	const wordmarkRowHeight = Math.round(wordmarkLineHeight + treeSize * 0.7);

	return (
		<View className="overflow-hidden">
			<LinearGradient
				colors={["#f2e6ce", "#ffffff"]}
				style={StyleSheet.absoluteFill}
			/>

			<View style={{ paddingTop: insets.top + 16 }} className="gap-5 px-6 pb-6">
				{isLoading ? (
					<HomeHeaderSkeleton />
				) : isAuthenticated ? (
					<HomeUserCard onOpenSettings={onOpenSettings} />
				) : null}

				<View style={{ height: wordmarkRowHeight }}>
					<Text
						numberOfLines={1}
						style={{
							fontFamily: "Oswald_700Bold",
							fontSize: 156,
							lineHeight: 180,
							letterSpacing: 4,
						}}
						className="text-white"
					>
						OIKOS
					</Text>

					<View style={{ width: 200 }}>
						<Text className="text-sm leading-5 text-gray-600">
							Denuncie ocorrências ambientais com foto e localização, vote com a
							comunidade e encontre empresas de reciclagem perto de você.
						</Text>
					</View>

					<Image
						source={NatureImage}
						style={{
							position: "absolute",
							top: Math.round(wordmarkLineHeight * 0.4),
							right: -Math.round(treeSize * 0.15),
							width: treeSize,
							height: treeSize,
						}}
						contentFit="contain"
					/>

					<FloatingGlassBadge
						items={HERO_BADGE_ITEMS}
						style={{
							position: "absolute",
							right: 4,
							bottom: 0,
						}}
					/>
				</View>

				{!isLoading && !isAuthenticated ? (
					<SlideToLoginButton onComplete={onPressLogin} />
				) : null}
			</View>
		</View>
	);
}

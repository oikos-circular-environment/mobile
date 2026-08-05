import type { Href } from "expo-router";
import type { ImageSourcePropType } from "react-native";

export interface ServiceCarouselItem {
	id: string;
	image: ImageSourcePropType;
	gradientColors: [string, string];
	title: string;
	ctaLabel: string;
	description: string;
	stepLabel: string;
	href: Href;
	onPress?: () => void;
}

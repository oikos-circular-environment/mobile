import { BlurTargetView, BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { ArrowUpRightIcon } from "lucide-react-native";
import { useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { colors } from "@/components/style/colors";
import { Text } from "@/components/ui/text";
import { useServicesCarouselContext } from "./context";
import { ServicesCarouselDebugOverlay } from "./services-carousel-debug-overlay";
import type { ServiceCarouselItem } from "./types";

interface ServicesCarouselCardProps {
	item: ServiceCarouselItem;
	index: number;
}

const FOOTER_LABELS = ["REDUZA", "REUTILIZE", "RECICLE"];

/** Liga o overlay de debug de temporização/pausa — só pra depuração manual, não é UI final. */
const SHOW_DEBUG_OVERLAY = true;

export function ServicesCarouselCard({
	item,
	index,
}: ServicesCarouselCardProps) {
	const { cardWidth, cardHeight, scale, activeIndex } =
		useServicesCarouselContext();
	const isActive = index === activeIndex;
	const blurTargetRef = useRef<View | null>(null);

	const cta = (
		<View
			className="flex-row items-center self-end overflow-hidden rounded-lg border border-white/40"
			style={{
				gap: 4 * scale,
				paddingVertical: 6 * scale,
				paddingHorizontal: 12 * scale,
			}}
		>
			<BlurView
				intensity={24}
				tint="dark"
				style={StyleSheet.absoluteFill}
				blurTarget={blurTargetRef}
				blurMethod="dimezisBlurView"
			/>
			<Text style={{ fontSize: 13 * scale }} className="font-medium text-white">
				{item.ctaLabel}
			</Text>
			<ArrowUpRightIcon size={13 * scale} color={colors.white} />
		</View>
	);

	return (
		<View
			style={{ width: cardWidth, height: cardHeight }}
			className="overflow-hidden rounded-lg"
		>
			<BlurTargetView ref={blurTargetRef} style={StyleSheet.absoluteFill}>
				<Image
					source={item.image}
					style={StyleSheet.absoluteFill}
					contentFit="cover"
				/>
				<LinearGradient
					colors={["transparent", item.gradientColors[0]]}
					locations={[0, 1]}
					style={{
						position: "absolute",
						bottom: 0,
						left: 0,
						right: 0,
						height: cardHeight * 0.6,
					}}
				/>
			</BlurTargetView>

			{isActive ? (
				<ServicesCarouselDebugOverlay
					isVisible={SHOW_DEBUG_OVERLAY}
					blurTarget={blurTargetRef}
				/>
			) : null}

			<View
				style={{ flex: 1, padding: 20 * scale }}
				className="justify-between"
			>
				<Text
					style={{
						fontFamily: "Oswald_700Bold",
						fontSize: 40 * scale,
						lineHeight: 50 * scale,
						paddingTop: 6 * scale,
						textAlign: "center",
						textShadowColor: "rgba(0,0,0,0.45)",
						textShadowOffset: { width: 0, height: 2 },
						textShadowRadius: 8,
					}}
					className="text-white uppercase"
				>
					{item.title}
				</Text>

				<View style={{ gap: 20 * scale }}>
					<View style={{ gap: 8 * scale }}>
						{item.onPress ? (
							<Pressable onPress={item.onPress}>{cta}</Pressable>
						) : (
							<Link href={item.href} asChild>
								<Pressable>{cta}</Pressable>
							</Link>
						)}

						<View
							className="overflow-hidden rounded-lg border border-white/30 flex-row items-start justify-start"
							style={{ padding: 12 * scale }}
						>
							<BlurView
								intensity={30}
								tint="dark"
								style={StyleSheet.absoluteFill}
								blurTarget={blurTargetRef}
								blurMethod="dimezisBlurView"
							/>
							<Text
								style={{
									fontSize: 13 * scale,
									lineHeight: 18 * scale,
									paddingRight: 20 * scale,
								}}
								className="text-white/90"
							>
								{item.description}
							</Text>
						</View>
					</View>

					<View
						className="flex-row items-center justify-between"
						style={{ gap: 8 * scale }}
					>
						{FOOTER_LABELS.map(label => (
							<Text
								key={label}
								style={{
									fontSize: 12 * scale,
									textShadowColor: "rgba(0,0,0,0.5)",
									textShadowOffset: { width: 0, height: 1 },
									textShadowRadius: 4,
								}}
								className="font-bold text-white"
							>
								{label}
							</Text>
						))}
					</View>
				</View>
			</View>
		</View>
	);
}

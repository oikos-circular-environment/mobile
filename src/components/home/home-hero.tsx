import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { RecycleIcon, RepeatIcon, TrendingDownIcon } from "lucide-react-native";
import { useState } from "react";
import {
	type LayoutChangeEvent,
	StyleSheet,
	useWindowDimensions,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NatureImage from "@/assets/images/nature.png";
import {
	FloatingGlassBadge,
	type FloatingGlassBadgeItem,
} from "@/components/home/floating-glass-badge";
import { HomeHeaderSkeleton } from "@/components/home/home-header-skeleton";
import { HomeUserCard } from "@/components/home/home-user-card";
import { LoginButton } from "@/components/home/login-button";
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

const WORDMARK_TEXT = "OIKOS";
const WORDMARK_BASELINE_FONT_SIZE = 100;
const WORDMARK_LETTER_SPACING_RATIO = 4 / 156;
// lineHeight menor que o fontSize corta o topo de letras redondas (M04) — essa
// proporção precisa ser aplicada de fato no Text (não só usada pra calcular o
// espaço reservado no layout), senão o line-height natural do SO pode ficar
// maior que o espaço reservado e voltar a cortar.
const WORDMARK_LINE_HEIGHT_RATIO = 1.15;

/**
 * Mede a largura (e, opcionalmente, a altura) natural do wordmark num fontSize
 * de referência e devolve o fontSize que faz ele preencher `availableWidth`
 * sem estourar `maxHeight` — funciona pra qualquer tamanho de tela (celular
 * pequeno, grande, tablet, paisagem) sem depender de um coeficiente fixo que
 * só bate no aparelho em que foi calibrado. Em paisagem a coluna do wordmark
 * é larga o bastante pra que "preencher a largura" sozinho gere uma fonte alta
 * demais pra caber na tela curta — daí o cap por altura.
 */
function useFitFontSize(availableWidth: number, maxHeight?: number) {
	const [measurement, setMeasurement] = useState<{
		width: number;
		maxHeight: number | undefined;
		fontSize: number;
	} | null>(null);

	const fontSize =
		measurement?.width === availableWidth &&
		measurement?.maxHeight === maxHeight
			? measurement.fontSize
			: null;

	const onBaselineLayout = (event: LayoutChangeEvent) => {
		const { width: measuredWidth, height: measuredHeight } =
			event.nativeEvent.layout;
		if (measuredWidth <= 0 || availableWidth <= 0) return;

		const widthFit =
			(WORDMARK_BASELINE_FONT_SIZE * availableWidth) / measuredWidth;
		const heightFit =
			maxHeight && measuredHeight > 0
				? (WORDMARK_BASELINE_FONT_SIZE * maxHeight) / measuredHeight
				: Number.POSITIVE_INFINITY;

		setMeasurement({
			width: availableWidth,
			maxHeight,
			fontSize: Math.min(widthFit, heightFit),
		});
	};

	return { fontSize, onBaselineLayout };
}

function WordmarkMeasureProbe({
	onLayout,
}: {
	onLayout: (event: LayoutChangeEvent) => void;
}) {
	return (
		<Text
			numberOfLines={1}
			onLayout={onLayout}
			pointerEvents="none"
			importantForAccessibility="no-hide-descendants"
			style={{
				position: "absolute",
				opacity: 0,
				fontFamily: "Oswald_700Bold",
				fontSize: WORDMARK_BASELINE_FONT_SIZE,
				letterSpacing:
					WORDMARK_BASELINE_FONT_SIZE * WORDMARK_LETTER_SPACING_RATIO,
			}}
		>
			{WORDMARK_TEXT}
		</Text>
	);
}

function Wordmark({ fontSize }: { fontSize: number }) {
	return (
		<Text
			numberOfLines={1}
			style={{
				fontFamily: "Oswald_700Bold",
				fontSize,
				lineHeight: Math.round(fontSize * WORDMARK_LINE_HEIGHT_RATIO),
				letterSpacing: fontSize * WORDMARK_LETTER_SPACING_RATIO,
			}}
			className="text-white"
		>
			{WORDMARK_TEXT}
		</Text>
	);
}

function HeroDescription({ maxWidth }: { maxWidth: number }) {
	return (
		<View style={{ maxWidth }}>
			<Text className="text-sm leading-5 text-gray-600">
				Denuncie ocorrências ambientais com foto e localização, vote com a
				comunidade e encontre empresas de reciclagem perto de você.
			</Text>
		</View>
	);
}

export function HomeHero({
	isAuthenticated,
	isLoading,
	onOpenSettings,
	onPressLogin,
}: HomeHeroProps) {
	const insets = useSafeAreaInsets();
	const { width, height } = useWindowDimensions();
	const isLandscape = width > height;

	const contentWidth = width - 48; // px-6 (24) de cada lado

	const portraitWidth = contentWidth;
	const landscapeWordmarkWidth = Math.round(contentWidth * 0.5);
	const landscapeWordmarkMaxHeight = Math.round(height * 0.35);

	const portrait = useFitFontSize(portraitWidth);
	const landscape = useFitFontSize(
		landscapeWordmarkWidth,
		landscapeWordmarkMaxHeight,
	);

	const header = isLoading ? (
		<HomeHeaderSkeleton />
	) : isAuthenticated ? (
		<HomeUserCard onOpenSettings={onOpenSettings} />
	) : null;

	const loginButton =
		!isLoading && !isAuthenticated ? (
			<LoginButton onPress={onPressLogin} />
		) : null;

	if (isLandscape) {
		const treeSize = Math.round(contentWidth * 0.32);

		return (
			<View className="overflow-hidden">
				<LinearGradient
					colors={["#f2e6ce", "#ffffff"]}
					style={StyleSheet.absoluteFill}
				/>

				<View
					style={{ paddingTop: insets.top + 16 }}
					className="flex-row items-center gap-5 px-6 pb-6"
				>
					<View className="flex-1 gap-4">
						{header}

						<View>
							{landscape.fontSize ? (
								<Wordmark fontSize={landscape.fontSize} />
							) : (
								<WordmarkMeasureProbe onLayout={landscape.onBaselineLayout} />
							)}
						</View>

						<HeroDescription maxWidth={landscapeWordmarkWidth} />

						{loginButton}
					</View>

					<View
						style={{ width: treeSize, height: treeSize }}
						className="items-center justify-center"
					>
						<Image
							source={NatureImage}
							style={{ width: treeSize, height: treeSize }}
							contentFit="contain"
						/>
						<FloatingGlassBadge
							items={HERO_BADGE_ITEMS}
							style={{ position: "absolute", right: 30, bottom: 25 }}
						/>
					</View>
				</View>
			</View>
		);
	}

	const wordmarkLineHeight = portrait.fontSize
		? Math.round(portrait.fontSize * WORDMARK_LINE_HEIGHT_RATIO)
		: 0;
	const treeSize = Math.round(portraitWidth * 0.62);
	const wordmarkRowHeight = Math.round(wordmarkLineHeight + treeSize * 0.7);

	return (
		<View className="overflow-hidden">
			<LinearGradient
				colors={["#f2e6ce", "#ffffff"]}
				style={StyleSheet.absoluteFill}
			/>

			<View style={{ paddingTop: insets.top + 16 }} className="gap-5 px-6 pb-6">
				{header}

				<View style={{ height: wordmarkRowHeight - 76 || undefined }}>
					{portrait.fontSize ? (
						<Wordmark fontSize={portrait.fontSize} />
					) : (
						<WordmarkMeasureProbe onLayout={portrait.onBaselineLayout} />
					)}

					<HeroDescription maxWidth={Math.round(portraitWidth * 0.55)} />

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

				{loginButton}
			</View>
		</View>
	);
}

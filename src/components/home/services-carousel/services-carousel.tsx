import type { ReactNode } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { useWindowDimensions, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import type { CarouselRef } from "react-native-reanimated-carousel";
import { ServicesCarouselContext } from "./context";
import type { ServiceCarouselItem } from "./types";

/** Largura de referência do card no design (Pencil, node TpouA). Usada só como base de proporção — nunca como valor fixo. */
const REFERENCE_CARD_WIDTH = 360;
const REFERENCE_ASPECT_RATIO = 640 / 360;
/** Fração da altura da janela que o card pode ocupar; com a proporção do design, é o que limita
 * o card em telas largas, no lugar de um teto fixo em pixels. */
const MAX_CARD_HEIGHT_RATIO = 0.75;

interface ServicesCarouselProps {
	items: ServiceCarouselItem[];
	autoPlayIntervalMs?: number;
	children: ReactNode;
}

export function ServicesCarousel({
	items,
	autoPlayIntervalMs = 5000,
	children,
}: ServicesCarouselProps) {
	const { height: windowHeight } = useWindowDimensions();
	const [containerWidth, setContainerWidth] = useState(0);
	const [activeIndex, setActiveIndex] = useState(0);
	const [isPaused, setIsPaused] = useState(false);
	const carouselRef = useRef<CarouselRef>(null);
	const progress = useSharedValue(0);

	const handleLayout = useCallback((event: LayoutChangeEvent) => {
		setContainerWidth(event.nativeEvent.layout.width);
	}, []);

	const cardWidth = Math.min(
		containerWidth || REFERENCE_CARD_WIDTH,
		(windowHeight * MAX_CARD_HEIGHT_RATIO) / REFERENCE_ASPECT_RATIO,
	);
	const cardHeight = cardWidth * REFERENCE_ASPECT_RATIO;
	const scale = cardWidth / REFERENCE_CARD_WIDTH;

	const goToIndex = useCallback((index: number) => {
		carouselRef.current?.scrollTo({ index, animated: true });
	}, []);

	const contextValue = useMemo(
		() => ({
			items,
			activeIndex,
			setActiveIndex,
			progress,
			carouselRef,
			autoPlayIntervalMs,
			isPaused,
			setIsPaused,
			cardWidth,
			cardHeight,
			scale,
			goToIndex,
		}),
		[
			items,
			activeIndex,
			progress,
			autoPlayIntervalMs,
			isPaused,
			cardWidth,
			cardHeight,
			scale,
			goToIndex,
		],
	);

	return (
		<View onLayout={handleLayout} className="gap-3">
			<ServicesCarouselContext.Provider value={contextValue}>
				{children}
			</ServicesCarouselContext.Provider>
		</View>
	);
}

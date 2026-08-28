import { useCallback, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { View } from "react-native";
import { ServicesCarouselCard } from "./services-carousel-card";
import type { ServiceCarouselItem } from "./types";

const REFERENCE_CARD_WIDTH = 360;
const CARD_GAP = 8;

interface ServicesRowProps {
	items: ServiceCarouselItem[];
}

export function ServicesRow({ items }: ServicesRowProps) {
	const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

	const handleLayout = useCallback((event: LayoutChangeEvent) => {
		const { width, height } = event.nativeEvent.layout;
		setContainerSize({ width, height });
	}, []);

	const totalGap = CARD_GAP * (items.length - 1);
	const cardWidth = Math.max(
		0,
		(containerSize.width - totalGap) / items.length,
	);
	const cardHeight = containerSize.height;
	const scale = cardWidth / REFERENCE_CARD_WIDTH;

	return (
		<View
			onLayout={handleLayout}
			className="flex-1 flex-row"
			style={{ gap: CARD_GAP }}
		>
			{containerSize.width > 0 && containerSize.height > 0
				? items.map((item, index) => (
						<View key={item.id} className="flex-1">
							<ServicesCarouselCard
								item={item}
								index={index}
								cardWidth={cardWidth}
								cardHeight={cardHeight}
								scale={scale}
								isActive={false}
							/>
						</View>
					))
				: null}
		</View>
	);
}

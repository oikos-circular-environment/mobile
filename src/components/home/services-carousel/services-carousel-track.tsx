import { useCallback, useEffect, useRef } from "react";
import { View } from "react-native";
import { cancelAnimation, Easing, withTiming } from "react-native-reanimated";
import type { CarouselPanGesture } from "react-native-reanimated-carousel";
import { Carousel } from "react-native-reanimated-carousel";
import { useServicesCarouselContext } from "./context";
import { ServicesCarouselCard } from "./services-carousel-card";

/** Distância (px) que o gesto precisa se mover na horizontal antes de "vencer" a arena de gestos.
 * Abaixo disso (ou se o movimento vertical superar isso primeiro), o gesto falha e o toque
 * cai naturalmente para o ScrollView pai, permitindo rolar a página tocando sobre o card. */
const PAN_GESTURE_THRESHOLD = 10;

export function ServicesCarouselTrack() {
	const {
		items,
		carouselRef,
		cardWidth,
		cardHeight,
		progress,
		setActiveIndex,
		autoPlayIntervalMs,
	} = useServicesCarouselContext();

	const restartProgress = useCallback(() => {
		progress.value = 0;
		progress.value = withTiming(1, {
			duration: autoPlayIntervalMs,
			easing: Easing.linear,
		});
	}, [progress, autoPlayIntervalMs]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: dispara só na montagem para animar o primeiro card
	useEffect(() => {
		restartProgress();
	}, []);

	const handleSnapToItem = useCallback(
		(index: number) => {
			setActiveIndex(index);
			restartProgress();
		},
		[setActiveIndex, restartProgress],
	);

	const handleConfigurePanGesture = useCallback(
		(gesture: CarouselPanGesture) => {
			gesture
				.activeOffsetX([-PAN_GESTURE_THRESHOLD, PAN_GESTURE_THRESHOLD])
				.failOffsetY([-PAN_GESTURE_THRESHOLD, PAN_GESTURE_THRESHOLD]);
		},
		[],
	);

	// A lib pausa o auto-advance internamente ao toque, mas a barra de progresso
	// (nossa animação separada) não tem ideia disso — precisa ser pausada/retomada
	// manualmente pra dar a resposta instantânea de "segurar = congela" (estilo Stories).
	const isPausedRef = useRef(false);

	const handleTouchStart = useCallback(() => {
		isPausedRef.current = true;
		cancelAnimation(progress);
	}, [progress]);

	const handleTouchRelease = useCallback(() => {
		if (!isPausedRef.current) return;
		isPausedRef.current = false;
		const remainingMs = Math.max(0, (1 - progress.value) * autoPlayIntervalMs);
		progress.value = withTiming(1, {
			duration: remainingMs,
			easing: Easing.linear,
		});
	}, [progress, autoPlayIntervalMs]);

	return (
		<View
			onTouchStart={handleTouchStart}
			onTouchEnd={handleTouchRelease}
			onTouchCancel={handleTouchRelease}
		>
			<Carousel
				ref={carouselRef}
				loop
				autoplay
				autoplayInterval={autoPlayIntervalMs}
				data={items}
				style={{ width: cardWidth, height: cardHeight, alignSelf: "center" }}
				onSnapToItem={handleSnapToItem}
				onConfigurePanGesture={handleConfigurePanGesture}
				renderItem={({ item }) => <ServicesCarouselCard item={item} />}
			/>
		</View>
	);
}

import { useCallback, useEffect } from "react";
import { View } from "react-native";
import { cancelAnimation, Easing, withTiming } from "react-native-reanimated";
import type { CarouselPanGesture } from "react-native-reanimated-carousel";
import { Carousel } from "react-native-reanimated-carousel";
import { scheduleOnRN } from "react-native-worklets";
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
		isPaused,
		setIsPaused,
	} = useServicesCarouselContext();

	// O auto-advance da própria lib reinicia do zero (5s inteiros) toda vez que o
	// usuário solta o toque, em vez de continuar do tempo restante — por isso o
	// avanço do card comanda por conta própria via `progress`: quando a barra
	// (que pausa/retoma corretamente) termina, nós mesmos chamamos next().
	const advanceToNext = useCallback(() => {
		carouselRef.current?.next({ animated: true });
	}, [carouselRef]);

	const scheduleProgressTo1 = useCallback(
		(durationMs: number) => {
			progress.value = withTiming(
				1,
				{ duration: durationMs, easing: Easing.linear },
				finished => {
					if (finished) {
						scheduleOnRN(advanceToNext);
					}
				},
			);
		},
		[progress, advanceToNext],
	);

	const restartProgress = useCallback(() => {
		progress.value = 0;
		scheduleProgressTo1(autoPlayIntervalMs);
	}, [progress, autoPlayIntervalMs, scheduleProgressTo1]);

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

	const handleTouchStart = useCallback(() => {
		setIsPaused(true);
		cancelAnimation(progress);
	}, [progress, setIsPaused]);

	const handleTouchRelease = useCallback(() => {
		if (!isPaused) return;
		setIsPaused(false);
		const remainingMs = Math.max(0, (1 - progress.value) * autoPlayIntervalMs);
		scheduleProgressTo1(remainingMs);
	}, [
		isPaused,
		progress,
		autoPlayIntervalMs,
		scheduleProgressTo1,
		setIsPaused,
	]);

	return (
		<View
			onTouchStart={handleTouchStart}
			onTouchEnd={handleTouchRelease}
			onTouchCancel={handleTouchRelease}
		>
			<Carousel
				ref={carouselRef}
				loop
				data={items}
				style={{ width: cardWidth, height: cardHeight, alignSelf: "center" }}
				onSnapToItem={handleSnapToItem}
				onConfigurePanGesture={handleConfigurePanGesture}
				renderItem={({ item, index }) => (
					<ServicesCarouselCard item={item} index={index} />
				)}
			/>
		</View>
	);
}

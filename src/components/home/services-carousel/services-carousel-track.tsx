import { useCallback, useEffect } from "react";
import { View } from "react-native";
import { cancelAnimation, Easing, withTiming } from "react-native-reanimated";
import type { CarouselPanGesture } from "react-native-reanimated-carousel";
import { Carousel } from "react-native-reanimated-carousel";
import { scheduleOnRN } from "react-native-worklets";
import { useServicesCarouselContext } from "./context";
import { ServicesCarouselCard } from "./services-carousel-card";

const PAN_GESTURE_THRESHOLD = 10;

export function ServicesCarouselTrack() {
	const {
		items,
		carouselRef,
		cardWidth,
		cardHeight,
		scale,
		activeIndex,
		progress,
		setActiveIndex,
		autoPlayIntervalMs,
		isPaused,
		setIsPaused,
	} = useServicesCarouselContext();

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
					<ServicesCarouselCard
						item={item}
						index={index}
						cardWidth={cardWidth}
						cardHeight={cardHeight}
						scale={scale}
						isActive={index === activeIndex}
					/>
				)}
			/>
		</View>
	);
}

import type { RefObject } from "react";
import { createContext, useContext } from "react";
import type { SharedValue } from "react-native-reanimated";
import type { CarouselRef } from "react-native-reanimated-carousel";
import type { ServiceCarouselItem } from "./types";

export interface ServicesCarouselContextValue {
	items: ServiceCarouselItem[];
	activeIndex: number;
	setActiveIndex: (index: number) => void;
	/** 0 → 1 a cada ciclo do card ativo; reinicia a cada troca (auto-play, swipe ou tap num step). */
	progress: SharedValue<number>;
	carouselRef: RefObject<CarouselRef | null>;
	autoPlayIntervalMs: number;
	/** true enquanto o usuário mantém o dedo sobre o carrossel (progress fica congelado). */
	isPaused: boolean;
	setIsPaused: (paused: boolean) => void;
	/** Largura real do card já limitada ao teto de tablet e escalada a partir da referência do Pencil (360). */
	cardWidth: number;
	cardHeight: number;
	/** cardWidth / 360 — usar para escalar fontSize/padding/cornerRadius extraídos do design. */
	scale: number;
	goToIndex: (index: number) => void;
}

export const ServicesCarouselContext =
	createContext<ServicesCarouselContextValue | null>(null);

export function useServicesCarouselContext() {
	const context = useContext(ServicesCarouselContext);
	if (!context) {
		throw new Error(
			"Componentes do ServicesCarousel devem ser usados dentro de <ServicesCarousel>.",
		);
	}
	return context;
}

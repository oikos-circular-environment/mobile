import { ServicesCarouselCard } from "./services-carousel-card";
import { ServicesCarouselDebugOverlay } from "./services-carousel-debug-overlay";
import { ServicesCarouselRoot } from "./services-carousel-root";
import { ServicesCarouselStep } from "./services-carousel-step";
import { ServicesCarouselSteps } from "./services-carousel-steps";
import { ServicesCarouselTrack } from "./services-carousel-track";

export const ServicesCarousel = {
	Root: ServicesCarouselRoot,
	Steps: ServicesCarouselSteps,
	Step: ServicesCarouselStep,
	Track: ServicesCarouselTrack,
	Card: ServicesCarouselCard,
	DebugOverlay: ServicesCarouselDebugOverlay,
};

export type { ServiceCarouselItem } from "./types";

import { View } from "react-native";
import { useServicesCarouselContext } from "./context";
import { ServicesCarouselStep } from "./services-carousel-step";

export function ServicesCarouselSteps() {
	const { items } = useServicesCarouselContext();

	return (
		<View className="flex-row items-center gap-2">
			{items.map((item, index) => (
				<ServicesCarouselStep key={item.id} item={item} index={index} />
			))}
		</View>
	);
}

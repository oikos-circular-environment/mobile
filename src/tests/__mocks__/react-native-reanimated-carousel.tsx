import * as React from "react";
import { View } from "react-native";

interface CarouselMockProps {
	data: unknown[];
	renderItem: (info: { item: unknown; index: number }) => React.ReactNode;
	onSnapToItem?: (index: number) => void;
}

/**
 * Mock de teste: renderiza todos os itens de uma vez (sem swipe/virtualização),
 * pra permitir consultar o conteúdo de qualquer card via RNTL. Segue o mesmo
 * padrão do mock de @gorhom/bottom-sheet.
 */
const Carousel = React.forwardRef<unknown, CarouselMockProps>(
	({ data, renderItem }, ref) => {
		React.useImperativeHandle(ref, () => ({
			scrollTo: jest.fn(),
			next: jest.fn(),
			prev: jest.fn(),
			getCurrentIndex: () => 0,
		}));

		return (
			<View>
				{data.map((item, index) => (
					<React.Fragment key={`carousel-mock-item-${index}`}>
						{renderItem({ item, index })}
					</React.Fragment>
				))}
			</View>
		);
	},
);
Carousel.displayName = "CarouselMock";

export { Carousel };

export const Pagination = () => null;

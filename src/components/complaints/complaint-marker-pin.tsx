import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors } from "@/components/style/colors";

const MARKER_PIN_PATH =
	"M4.74,21.5 A13,13 0 1 1 27.26,21.5 L18.6,36.5 A3,3 0 0 1 13.4,36.5 Z";

export function ComplaintMarkerPin({
	color,
	selected,
}: {
	color: string;
	selected: boolean;
}) {
	return (
		<View
			style={{
				shadowColor: colors.black,
				shadowOffset: { width: 0, height: 2 },
				shadowOpacity: 0.35,
				shadowRadius: 3,
			}}
		>
			<Svg width={30} height={38} viewBox="0 0 32 40">
				<Path
					d={MARKER_PIN_PATH}
					fill={color}
					stroke={colors.white}
					strokeWidth={selected ? 2.5 : 1.5}
				/>
			</Svg>
		</View>
	);
}

import { ImageIcon } from "lucide-react-native";
import { colors } from "@/components/style/colors";
import { Pressable } from "@/components/ui/pressable";
import { Spinner } from "@/components/ui/spinner";

type AddMediaTileProps = {
	onPress: () => void;
	isPicking: boolean;
};

export function AddMediaTile({ onPress, isPicking }: AddMediaTileProps) {
	return (
		<Pressable
			onPress={onPress}
			disabled={isPicking}
			className="items-center justify-center rounded-xl border border-gray-200 bg-gray-50"
			style={{ width: 80, height: 80 }}
		>
			{isPicking ? (
				<Spinner color={colors.gray[400]} />
			) : (
				<ImageIcon size={24} color={colors.gray[400]} strokeWidth={1.5} />
			)}
		</Pressable>
	);
}

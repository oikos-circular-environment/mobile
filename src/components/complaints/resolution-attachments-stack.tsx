import { ArrowLeftIcon } from "lucide-react-native";
import { useState } from "react";
import {
	Dimensions,
	FlatList,
	Modal,
	TouchableOpacity,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ImagePreviewViewer } from "@/components/medias-preview/image-preview-viewer";
import { MediaThumbnail } from "@/components/medias-preview/media-thumbnail";
import { colors } from "@/components/style/colors";
import { Text } from "@/components/ui/text";

type Attachment = {
	id: string;
	url: string;
	file_name: string;
};

const CARD_SIZE = 56;
const PEEK = 6;
const CONTAINER_WIDTH = CARD_SIZE + PEEK * 2;

const STACK_LAYERS = [
	{ scale: 0.88, translateX: PEEK * 2, opacity: 0.45 },
	{ scale: 0.94, translateX: PEEK, opacity: 0.7 },
	{ scale: 1.0, translateX: 0, opacity: 1.0 },
] as const;

const SCREEN_WIDTH = Dimensions.get("window").width;

type ResolutionAttachmentsStackProps = {
	attachments: Attachment[];
};

export function ResolutionAttachmentsStack({
	attachments,
}: ResolutionAttachmentsStackProps) {
	const [previewVisible, setPreviewVisible] = useState(false);
	const [previewIndex, setPreviewIndex] = useState(0);
	const insets = useSafeAreaInsets();

	if (attachments.length === 0) return null;

	const stackItems = attachments.slice(-3);

	return (
		<>
			<TouchableOpacity
				onPress={() => {
					setPreviewIndex(0);
					setPreviewVisible(true);
				}}
				activeOpacity={0.85}
			>
				<View style={{ width: CONTAINER_WIDTH, height: CARD_SIZE }}>
					{stackItems.map((att, index) => {
						const layerIndex = index + (3 - stackItems.length);
						const layer = STACK_LAYERS[layerIndex] ?? STACK_LAYERS[2];
						return (
							<View
								key={att.id}
								style={{
									position: "absolute",
									top: 0,
									left: 0,
									width: CARD_SIZE,
									height: CARD_SIZE,
									transform: [
										{ scale: layer.scale },
										{ translateX: layer.translateX },
									],
									opacity: layer.opacity,
								}}
							>
								<View
									style={{
										flex: 1,
										overflow: "hidden",
										borderRadius: 8,
										borderWidth: 1,
										borderColor: "rgba(255,255,255,0.1)",
									}}
								>
									<MediaThumbnail mediaType="photo" uri={att.url} />
								</View>
							</View>
						);
					})}

					{attachments.length > 1 && (
						<View
							style={{
								position: "absolute",
								bottom: -4,
								right: -4,
								backgroundColor: colors.gray[700],
								borderRadius: 10,
								minWidth: 18,
								height: 18,
								alignItems: "center",
								justifyContent: "center",
								paddingHorizontal: 4,
							}}
						>
							<Text
								style={{ fontSize: 10, color: colors.white, fontWeight: "700" }}
							>
								{attachments.length}
							</Text>
						</View>
					)}
				</View>
			</TouchableOpacity>

			<Modal
				visible={previewVisible}
				animationType="fade"
				statusBarTranslucent
				onRequestClose={() => setPreviewVisible(false)}
			>
				<View style={{ flex: 1, backgroundColor: colors.black }}>
					<FlatList
						data={attachments}
						keyExtractor={item => item.id}
						horizontal
						pagingEnabled
						showsHorizontalScrollIndicator={false}
						initialScrollIndex={previewIndex}
						getItemLayout={(_, index) => ({
							length: SCREEN_WIDTH,
							offset: SCREEN_WIDTH * index,
							index,
						})}
						onMomentumScrollEnd={e => {
							const index = Math.round(
								e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
							);
							setPreviewIndex(index);
						}}
						renderItem={({ item }) => (
							<View style={{ width: SCREEN_WIDTH, flex: 1 }}>
								<ImagePreviewViewer uri={item.url} />
							</View>
						)}
					/>

					<TouchableOpacity
						style={{
							position: "absolute",
							left: 16,
							top: insets.top + 8,
							borderRadius: 12,
							backgroundColor: "rgba(0,0,0,0.5)",
							padding: 12,
						}}
						onPress={() => setPreviewVisible(false)}
					>
						<ArrowLeftIcon size={20} color={colors.white} strokeWidth={2.2} />
					</TouchableOpacity>

					{attachments.length > 1 && (
						<View
							style={{
								position: "absolute",
								bottom: insets.bottom + 16,
								alignSelf: "center",
								backgroundColor: "rgba(0,0,0,0.5)",
								borderRadius: 12,
								paddingHorizontal: 12,
								paddingVertical: 6,
							}}
						>
							<Text style={{ color: colors.white, fontSize: 13 }}>
								{previewIndex + 1} / {attachments.length}
							</Text>
						</View>
					)}
				</View>
			</Modal>
		</>
	);
}

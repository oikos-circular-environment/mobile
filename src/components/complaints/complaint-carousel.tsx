import { useState } from "react";
import { ScrollView, View } from "react-native";
import { MediaThumbnail, MediaViewer } from "@/components/medias-preview";
import { Pressable } from "@/components/ui/pressable";
import type { ComplaintCapture } from "@/libs/types/complaint";
import { cn } from "@/libs/utils";

type ComplaintCaptureCarouselProps = {
	captures: ComplaintCapture[];
	selectedCaptureId: string;
	onSelectCapture: (captureId: string) => void;
	onDeleteCapture: (captureId: string) => void;
};

export function ComplaintCarousel({
	captures,
	selectedCaptureId,
	onDeleteCapture,
	onSelectCapture,
}: ComplaintCaptureCarouselProps) {
	const [viewingCaptureId, setViewingCaptureId] = useState<string | null>(null);

	const viewingCapture = captures.find(c => c.id === viewingCaptureId) ?? null;

	const handlePress = (captureId: string) => {
		onSelectCapture(captureId);
		setViewingCaptureId(captureId);
	};

	return (
		<>
			<ScrollView
				horizontal
				nestedScrollEnabled
				keyboardShouldPersistTaps="handled"
				showsHorizontalScrollIndicator={false}
			>
				<View className="flex-row gap-2 pr-4">
					{captures.map(capture => {
						const captureUri = capture.capture.object?.uri;
						const isSelected = capture.id === selectedCaptureId;

						return (
							<Pressable
								key={capture.id}
								className={cn(
									"size-24 overflow-hidden rounded-lg border p-0.5",
									isSelected ? "border-lime-800" : "border-gray-200",
								)}
								onPress={() => handlePress(capture.id)}
								hitSlop={6}
							>
								<MediaThumbnail
									mediaType={capture.capture.type}
									uri={captureUri}
									loadingLabel="Carregando"
									fallbackLabel="Vídeo"
								/>
							</Pressable>
						);
					})}
				</View>
			</ScrollView>

			<MediaViewer
				visible={!!viewingCaptureId}
				capture={viewingCapture}
				onClose={() => setViewingCaptureId(null)}
				onDelete={id => {
					onDeleteCapture(id);
					setViewingCaptureId(null);
				}}
			/>
		</>
	);
}

import { Image } from "expo-image";
import type { VideoThumbnail } from "expo-video";
import { useVideoPlayer } from "expo-video";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";

type MediaThumbnailState = VideoThumbnail | "failed";

type MediaThumbnailProps = {
	mediaType: "photo" | "video";
	uri?: string;
	fallbackLabel?: string;
};

const styles = StyleSheet.create({
	overlay: {
		...StyleSheet.absoluteFillObject,
		borderRadius: 6,
	},
});

export function MediaThumbnail({
	mediaType,
	uri,
	fallbackLabel = "MEDIA",
}: MediaThumbnailProps) {
	const [videoThumbnail, setVideoThumbnail] = useState<
		MediaThumbnailState | undefined
	>(undefined);
	const [photoState, setPhotoState] = useState<"loading" | "loaded" | "failed">(
		uri ? "loading" : "failed",
	);
	const isMountedRef = useRef(true);

	const player = useVideoPlayer(mediaType === "video" && uri ? { uri } : null);

	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	// Reset photo state when uri changes
	useEffect(() => {
		if (mediaType !== "photo") return;
		setPhotoState(uri ? "loading" : "failed");
	}, [mediaType, uri]);

	// Generate video thumbnail
	useEffect(() => {
		if (mediaType !== "video" || !uri) {
			setVideoThumbnail(undefined);
			return;
		}

		setVideoThumbnail(undefined);

		const generateThumbnail = async () => {
			try {
				const results = await player.generateThumbnailsAsync([0.5], {
					maxHeight: 240,
				});
				if (isMountedRef.current) {
					setVideoThumbnail(results[0] ?? "failed");
				}
			} catch {
				if (isMountedRef.current) {
					setVideoThumbnail("failed");
				}
			}
		};

		// Escuta transições de status — generateThumbnailsAsync só funciona em readyToPlay.
		const subscription = player.addListener("statusChange", ({ status }) => {
			if (status === "readyToPlay") {
				void generateThumbnail();
			}
		});

		if (player.status === "readyToPlay") {
			void generateThumbnail();
		}

		return () => {
			subscription.remove();
		};
	}, [mediaType, uri, player]);

	if (mediaType === "photo") {
		if (!uri) {
			return (
				<View className="flex-1 items-center justify-center bg-gray-500">
					<Text className="text-[10px] text-white/70">{fallbackLabel}</Text>
				</View>
			);
		}

		return (
			<View className="flex-1">
				<Image
					source={{ uri }}
					style={{ height: "100%", width: "100%", borderRadius: 6 }}
					contentFit="cover"
					onLoad={() => setPhotoState("loaded")}
					onError={() => setPhotoState("failed")}
				/>
				{photoState === "loading" && (
					<Skeleton
						variant="rounded"
						startColor="bg-gray-500"
						style={styles.overlay}
					/>
				)}
				{photoState === "failed" && (
					<View
						style={styles.overlay}
						className="items-center justify-center bg-gray-500"
					>
						<Text className="text-[10px] font-semibold text-white">
							{fallbackLabel}
						</Text>
					</View>
				)}
			</View>
		);
	}

	if (!uri || videoThumbnail === undefined) {
		return (
			<Skeleton variant="rounded" startColor="bg-gray-500" className="flex-1" />
		);
	}

	if (videoThumbnail === "failed") {
		return (
			<View className="flex-1 items-center justify-center bg-gray-500">
				<Text className="text-[10px] font-semibold text-white">
					{fallbackLabel}
				</Text>
			</View>
		);
	}

	return (
		<Image
			source={videoThumbnail}
			style={{ height: "100%", width: "100%", borderRadius: 6 }}
			contentFit="cover"
		/>
	);
}

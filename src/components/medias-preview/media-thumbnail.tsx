import { Image } from "expo-image";
import type { VideoThumbnail } from "expo-video";
import { useVideoPlayer } from "expo-video";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";

type MediaThumbnailState = VideoThumbnail | "failed";

type MediaThumbnailProps = {
	mediaType: "photo" | "video";
	uri?: string;
	loadingLabel?: string;
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
	loadingLabel = "Carregando",
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
				<View className="flex-1 items-center justify-center bg-zinc-700">
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
					<View
						style={styles.overlay}
						className="items-center justify-center bg-zinc-700"
					>
						<Spinner size="small" color="grey" />
						<Text className="mt-1 text-[10px] text-white/70">
							{loadingLabel}
						</Text>
					</View>
				)}
				{photoState === "failed" && (
					<View
						style={styles.overlay}
						className="items-center justify-center bg-zinc-800"
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
			<View className="flex-1 items-center justify-center bg-zinc-700">
				<Spinner size="small" color="grey" />
				<Text className="mt-1 text-[10px] text-white/70">{loadingLabel}</Text>
			</View>
		);
	}

	if (videoThumbnail === "failed") {
		return (
			<View className="flex-1 items-center justify-center bg-zinc-800">
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

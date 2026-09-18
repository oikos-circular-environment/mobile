import { Image } from "expo-image";
import { Observe } from "expo-observe";
import type { VideoThumbnail } from "expo-video";
import { useVideoPlayer } from "expo-video";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { getAuthenticatedImageHeaders } from "@/libs/api/oikos-api";
import { formatFileSize, MAX_FILE_SIZE_BYTES } from "@/libs/media/validation";
import { cn } from "@/libs/utils";

type MediaThumbnailState = VideoThumbnail | "failed";

type MediaThumbnailProps = {
	mediaType: "photo" | "video";
	uri?: string;
	fallbackLabel?: string;
	fileSizeBytes?: number;
};

const styles = StyleSheet.create({
	overlay: {
		...StyleSheet.absoluteFill,
		borderRadius: 6,
	},
	badge: {
		position: "absolute",
		bottom: 4,
		left: 4,
	},
});

function FileSizeBadge({ bytes }: { bytes: number }) {
	const isOverLimit = bytes > MAX_FILE_SIZE_BYTES;
	return (
		<View
			style={styles.badge}
			className={cn(
				"rounded px-1 py-0.5",
				isOverLimit ? "bg-red-600" : "bg-black/60",
			)}
		>
			<Text className="text-[9px] font-semibold leading-tight text-white">
				{formatFileSize(bytes)}
			</Text>
		</View>
	);
}

export function MediaThumbnail({
	mediaType,
	uri,
	fallbackLabel = "MEDIA",
	fileSizeBytes,
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
			} catch (error) {
				Observe.reportError(error);
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
					source={{ uri, headers: getAuthenticatedImageHeaders() }}
					style={{ height: "100%", width: "100%", borderRadius: 6 }}
					contentFit="cover"
					onLoad={() => setPhotoState("loaded")}
					onError={() => setPhotoState("failed")}
				/>
				{photoState === "loaded" && fileSizeBytes != null && (
					<FileSizeBadge bytes={fileSizeBytes} />
				)}
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
		<View className="flex-1">
			<Image
				source={videoThumbnail}
				style={{ height: "100%", width: "100%", borderRadius: 6 }}
				contentFit="cover"
			/>
			{fileSizeBytes != null && <FileSizeBadge bytes={fileSizeBytes} />}
		</View>
	);
}

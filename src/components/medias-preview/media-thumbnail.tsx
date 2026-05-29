import { Image } from "expo-image";
import type { VideoThumbnail } from "expo-video";
import { useVideoPlayer } from "expo-video";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";

type MediaThumbnailState = VideoThumbnail | "failed";

type MediaThumbnailProps = {
	mediaType: "photo" | "video";
	uri?: string;
	loadingLabel?: string;
	fallbackLabel?: string;
};

export function MediaThumbnail({
	mediaType,
	uri,
	loadingLabel = "Carregando",
	fallbackLabel = "MEDIA",
}: MediaThumbnailProps) {
	const [thumbnail, setThumbnail] = useState<MediaThumbnailState | undefined>(
		undefined,
	);
	const isMountedRef = useRef(true);

	// useVideoPlayer gerencia o ciclo de vida e libera o player automaticamente no unmount.
	// Passa null para fotos para não criar player desnecessariamente.
	const player = useVideoPlayer(mediaType === "video" && uri ? { uri } : null);

	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	useEffect(() => {
		if (mediaType !== "video" || !uri) {
			setThumbnail(undefined);
			return;
		}

		setThumbnail(undefined);

		const generateThumbnail = async () => {
			try {
				const results = await player.generateThumbnailsAsync([0.5], {
					maxHeight: 240,
				});
				if (isMountedRef.current) {
					setThumbnail(results[0] ?? "failed");
				}
			} catch {
				if (isMountedRef.current) {
					setThumbnail("failed");
				}
			}
		};

		// Escuta transições de status — generateThumbnailsAsync só funciona em readyToPlay.
		const subscription = player.addListener("statusChange", ({ status }) => {
			if (status === "readyToPlay") {
				void generateThumbnail();
			}
		});

		// Caso o player já esteja pronto (ex: fonte em cache).
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
			<Image
				source={{ uri }}
				style={{ height: "100%", width: "100%", borderRadius: 6 }}
				contentFit="cover"
			/>
		);
	}

	if (!uri || thumbnail === undefined) {
		return (
			<View className="flex-1 items-center justify-center bg-zinc-700">
				<Spinner size="small" color="grey" />
				<Text className="mt-1 text-[10px] text-white/70">{loadingLabel}</Text>
			</View>
		);
	}

	if (thumbnail === "failed") {
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
			source={thumbnail}
			style={{ height: "100%", width: "100%", borderRadius: 6 }}
			contentFit="cover"
		/>
	);
}

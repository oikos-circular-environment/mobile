import { useVideoPlayer, VideoView } from "expo-video";

type VideoPreviewPlayerProps = {
	uri: string;
};

export function VideoPreviewPlayer({ uri }: VideoPreviewPlayerProps) {
	const player = useVideoPlayer(uri, setupPlayer => {
		setupPlayer.loop = true;
		setupPlayer.play();
	});

	return <VideoView player={player} nativeControls style={{ flex: 1 }} />;
}

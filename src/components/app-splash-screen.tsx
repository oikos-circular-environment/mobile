import { LinearGradient } from "expo-linear-gradient";
import { useVideoPlayer, VideoView } from "expo-video";
import { useCallback } from "react";
import { Dimensions, Image, StyleSheet, View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";

const splashPoster = require("@/assets/images/splash-poster.png");
const splashVideo = require("@/assets/videos/splash-motion.mp4");

const VIDEO_FADE_IN_MS = 300;

const MEDIA_WIDTH = 720;
const MEDIA_HEIGHT = 1280;

const CORNER_COLOR = "#BDAE94";
const EDGE_COLOR = "#C4B49E";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const MEDIA_SCALE = Math.min(
	SCREEN_WIDTH / MEDIA_WIDTH,
	SCREEN_HEIGHT / MEDIA_HEIGHT,
);
const LETTERBOX_GAP = Math.max(
	0,
	(SCREEN_HEIGHT - MEDIA_HEIGHT * MEDIA_SCALE) / 2,
);

export function SplashBackdrop() {
	return (
		<View style={styles.container}>
			{LETTERBOX_GAP > 0 && (
				<>
					<LinearGradient
						colors={[CORNER_COLOR, EDGE_COLOR]}
						style={[styles.letterbox, { top: 0, height: LETTERBOX_GAP }]}
					/>
					<LinearGradient
						colors={[EDGE_COLOR, CORNER_COLOR]}
						style={[styles.letterbox, { bottom: 0, height: LETTERBOX_GAP }]}
					/>
				</>
			)}
			<Image source={splashPoster} style={styles.media} resizeMode="contain" />
		</View>
	);
}

export function AppSplashScreen() {
	const videoOpacity = useSharedValue(0);

	const player = useVideoPlayer(splashVideo, player => {
		player.play();
	});

	const handleFirstFrameRender = useCallback(() => {
		videoOpacity.value = withTiming(1, { duration: VIDEO_FADE_IN_MS });
	}, [videoOpacity]);

	const videoAnimatedStyle = useAnimatedStyle(() => ({
		opacity: videoOpacity.value,
	}));

	return (
		<View style={styles.container}>
			<SplashBackdrop />
			<Animated.View style={[styles.media, videoAnimatedStyle]}>
				<VideoView
					player={player}
					style={styles.media}
					contentFit="contain"
					nativeControls={false}
					surfaceType="textureView"
					onFirstFrameRender={handleFirstFrameRender}
				/>
			</Animated.View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: CORNER_COLOR,
	},
	media: {
		position: "absolute",
		top: 0,
		left: 0,
		width: SCREEN_WIDTH,
		height: SCREEN_HEIGHT,
	},
	letterbox: {
		position: "absolute",
		left: 0,
		right: 0,
	},
});

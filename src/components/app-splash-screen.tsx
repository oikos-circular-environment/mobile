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
// 4x256 gradient from CORNER_COLOR (top) to EDGE_COLOR (bottom), stretched
// to fill the letterbox bars — avoids expo-linear-gradient, which needs a
// native rebuild to work in an already-installed dev client.
const letterboxGradient = require("@/assets/images/splash-letterbox-gradient.png");

const VIDEO_FADE_IN_MS = 300;

// Matches src/assets/videos/splash-motion.mp4 (and its poster frame).
const MEDIA_WIDTH = 720;
const MEDIA_HEIGHT = 1280;

// The poster/video background has a vignette — darker at the corners than
// along the middle of each edge — so a flat backdrop color always mismatches
// somewhere. CORNER_COLOR is the fallback fill (used when there's no
// letterbox gap to render); splash-letterbox-gradient.png carries the actual
// corner-to-edge blend, sampled directly from the asset.
const CORNER_COLOR = "#BDAE94";

// RN's <Image resizeMode> is unreliable when the box comes from
// StyleSheet.absoluteFill percentages; an explicit pixel size avoids that.
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Contain-fit math for MEDIA_WIDTH x MEDIA_HEIGHT inside the screen, so the
// letterbox gradient bars are sized to exactly the empty strip left over —
// no more guessing where the media edge actually lands.
const MEDIA_SCALE = Math.min(
	SCREEN_WIDTH / MEDIA_WIDTH,
	SCREEN_HEIGHT / MEDIA_HEIGHT,
);
const LETTERBOX_GAP = Math.max(
	0,
	(SCREEN_HEIGHT - MEDIA_HEIGHT * MEDIA_SCALE) / 2,
);

// The static poster + letterbox, without the video. Used both as the base
// layer under the video (AppSplashScreen) and, on its own, as the frozen
// frame RootLayout shows for the one frame between unmounting the video and
// mounting the full app tree — so that handoff doesn't look like the splash
// content disappearing into a blank background.
export function SplashBackdrop() {
	return (
		<View style={styles.container}>
			{LETTERBOX_GAP > 0 && (
				<>
					<Image
						source={letterboxGradient}
						resizeMode="stretch"
						style={[styles.letterbox, { top: 0, height: LETTERBOX_GAP }]}
					/>
					<Image
						source={letterboxGradient}
						resizeMode="stretch"
						style={[
							styles.letterbox,
							{ bottom: 0, height: LETTERBOX_GAP, transform: [{ scaleY: -1 }] },
						]}
					/>
				</>
			)}
			<Image source={splashPoster} style={styles.media} resizeMode="contain" />
		</View>
	);
}

export function AppSplashScreen() {
	const videoOpacity = useSharedValue(0);

	// Not looped: the splash only ever shows this once, for as long as
	// SPLASH_VIDEO_DURATION_MS in _layout.tsx (matched to this asset's real
	// length) — looping made ExoPlayer seek back to frame 0 and restart
	// right as it reached the end, which flashed as a visible "rewind" a
	// moment before our own timeout cut away.
	const player = useVideoPlayer(splashVideo, player => {
		player.play();
	});

	// VideoView renders blank until the first frame decodes; keep the poster
	// underneath and only reveal the video once it has something to show.
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

import type { CameraCapturedPicture } from "expo-camera";
import * as Crypto from "expo-crypto";
import { router } from "expo-router";
import { ArrowLeft, ArrowRight } from "lucide-react-native";
import { TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Camera } from "@/components/camera";
import { useComplaintCreate } from "@/components/complaints/hooks/use-complaint-create";
import { colors } from "@/components/style/colors";
import { useGeospatial } from "@/contexts/geospatial-context";
import type {
	CameraCapturedVideo,
	ComplaintCapture,
	ComplaintCaptureMode,
	Geospatial,
} from "@/libs/types/complaint";

export default function ComplaintCameraScreen() {
	const { addCapture, captures, deleteCapture } = useComplaintCreate();
	const { addresses, location, heading } = useGeospatial();
	const insets = useSafeAreaInsets();

	function saveInMemory(
		captureObject: CameraCapturedPicture | CameraCapturedVideo,
		captureType: ComplaintCaptureMode,
	) {
		try {
			const nowIso = new Date().toISOString();

			const geospatial: Geospatial = {
				heading: heading
					? {
							trueHeading: heading.trueHeading,
							magHeading: heading.magHeading,
							accuracy: heading.accuracy,
						}
					: { trueHeading: 0, magHeading: 0, accuracy: 0 },
				location: location
					? {
							coords: {
								latitude: location.coords.latitude,
								longitude: location.coords.longitude,
								altitude: location.coords.altitude,
								accuracy: location.coords.accuracy,
								altitudeAccuracy: location.coords.altitudeAccuracy,
								heading: location.coords.heading,
								speed: location.coords.speed,
							},
							timestamp: location.timestamp,
						}
					: {
							coords: {
								latitude: 0,
								longitude: 0,
								altitude: null,
								accuracy: null,
								altitudeAccuracy: null,
								heading: null,
								speed: null,
							},
							timestamp: Date.now(),
						},
				addresses: addresses[0]
					? {
							city: addresses[0].city,
							district: addresses[0].district,
							streetNumber: addresses[0].streetNumber,
							street: addresses[0].street,
							region: addresses[0].region,
							subregion: addresses[0].subregion,
							country: addresses[0].country,
							postalCode: addresses[0].postalCode,
							name: addresses[0].name,
							isoCountryCode: addresses[0].isoCountryCode,
							timezone: addresses[0].timezone,
							formattedAddress: addresses[0].formattedAddress,
						}
					: {
							city: null,
							district: null,
							streetNumber: null,
							street: null,
							region: null,
							subregion: null,
							country: null,
							postalCode: null,
							name: null,
							isoCountryCode: null,
							timezone: null,
							formattedAddress: null,
						},
			};

			const snapshot: ComplaintCapture = {
				id: Crypto.randomUUID(),
				capture: { type: captureType, object: captureObject },
				date: nowIso,
				geospatial,
				type: "IRREGULAR_DISPOSAL",
				observation: "",
				created_at: nowIso,
				updated_at: nowIso,
			};

			addCapture(snapshot);
		} catch (err) {
			console.error("[saveInMemory] failed:", err);
		}
	}

	const handleAdvance = () => {
		if (captures.length === 0) return;
		router.push("/(tabs)/complaints/(create)/review");
	};

	return (
		<Camera onCapture={saveInMemory}>
			<Camera.Preview />

			<View
				className="absolute left-0 right-0 flex-row px-5"
				style={{ top: insets.top + 16 }}
			>
				<TouchableOpacity
					className="rounded-xl p-3"
					onPress={() => router.back()}
				>
					<ArrowLeft size={20} color={colors.white} strokeWidth={2.2} />
				</TouchableOpacity>
			</View>

			{/* <Camera.RecordingTimer /> */}

			<Camera.GeospatialOverlay />

			<Camera.ZoomControls style={{ bottom: insets.bottom + 120 }} />

			{/* <Camera.ModeSelector style={{ bottom: insets.bottom + 120 }} /> */}

			<View
				className="absolute left-0 right-0 px-4"
				style={{ bottom: insets.bottom + 10 }}
			>
				<View className="flex-row items-end justify-between">
					<Camera.MediaPreview captures={captures} onDelete={deleteCapture} />

					<Camera.CaptureButton />

					<TouchableOpacity
						className={`h-20 w-20 items-center justify-center rounded-xl ${
							captures.length > 0 ? "bg-white" : "bg-white/40"
						}`}
						onPress={handleAdvance}
						disabled={captures.length === 0}
					>
						<ArrowRight size={34} color={colors.lime[800]} strokeWidth={2.2} />
					</TouchableOpacity>
				</View>
			</View>
		</Camera>
	);
}

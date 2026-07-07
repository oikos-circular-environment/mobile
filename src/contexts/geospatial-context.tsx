import * as Location from "expo-location";
import {
	createContext,
	type PropsWithChildren,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { LogBox } from "react-native";

type GeospatialContextValue = {
	currentDate: Date;
	heading: Location.LocationHeadingObject | null;
	location: Location.LocationObject | null;
	addresses: Location.LocationGeocodedAddress[];
	permissionDenied: boolean;
	isResolving: boolean;
	reverseGeocodeError: boolean;
};

const GeospatialContext = createContext<GeospatialContextValue | null>(null);

if (__DEV__) {
	// Fast Refresh can tear down the native AppContext while watchHeadingAsync/
	// watchPositionAsync's remove() (fire-and-forget ExpoLocation.removeWatchAsync
	// internally) is still in flight, rejecting with "AppContextLost" as an unhandled
	// promise — there's no JS-side handle to the underlying promise to catch it
	// ourselves. Known upstream race (https://github.com/expo/expo/issues/46975),
	// worse on New Architecture. Fix merged upstream
	// (https://github.com/expo/expo/pull/47080) but unreleased as of
	// expo-modules-core 56.0.19 — remove this once it ships.
	LogBox.ignoreLogs(["AppContextLost", "app context has been lost"]);
}

export function GeospatialProvider({ children }: PropsWithChildren) {
	const [currentDate, setCurrentDate] = useState(new Date());
	const [heading, setHeading] = useState<Location.LocationHeadingObject | null>(
		null,
	);
	const [location, setLocation] = useState<Location.LocationObject | null>(
		null,
	);
	const [addresses, setAddresses] = useState<
		Location.LocationGeocodedAddress[]
	>([]);
	const [permissionDenied, setPermissionDenied] = useState(false);
	const [isResolving, setIsResolving] = useState(true);
	const [reverseGeocodeError, setReverseGeocodeError] = useState(false);

	const lastReverseGeocodeAtRef = useRef<number>(0);

	useEffect(() => {
		const timer = setInterval(() => {
			setCurrentDate(new Date());
		}, 1000);

		return () => {
			clearInterval(timer);
		};
	}, []);

	useEffect(() => {
		let isMounted = true;
		let headingSubscription: Location.LocationSubscription | null = null;
		let locationSubscription: Location.LocationSubscription | null = null;

		const shouldReverseGeocode = () => {
			const now = Date.now();

			if (now - lastReverseGeocodeAtRef.current < 15000) {
				return false;
			}

			lastReverseGeocodeAtRef.current = now;
			return true;
		};

		const startWatchers = async () => {
			try {
				setIsResolving(true);

				const currentPermission =
					await Location.getForegroundPermissionsAsync();
				let granted = currentPermission.status === "granted";

				if (!granted) {
					const requestedPermission =
						await Location.requestForegroundPermissionsAsync();
					granted = requestedPermission.status === "granted";
				}

				if (!granted) {
					if (isMounted) {
						setPermissionDenied(true);
					}
					return;
				}

				if (isMounted) {
					setPermissionDenied(false);
				}

				try {
					headingSubscription = await Location.watchHeadingAsync(
						nextHeading => {
							if (isMounted) {
								setHeading(nextHeading);
							}
						},
					);
				} catch {
					// Compass/magnetometer hardware may be absent (common on iPads) —
					// heading just stays null, already handled gracefully by every
					// consumer. Must not affect permissionDenied/location below.
				}

				locationSubscription = await Location.watchPositionAsync(
					{
						accuracy: Location.Accuracy.High,
						timeInterval: 2000,
						distanceInterval: 2,
						mayShowUserSettingsDialog: true,
					},
					async nextLocation => {
						if (!isMounted) {
							return;
						}

						setLocation(nextLocation);

						if (!shouldReverseGeocode()) {
							return;
						}

						try {
							const result = await Location.reverseGeocodeAsync({
								latitude: nextLocation.coords.latitude,
								longitude: nextLocation.coords.longitude,
							});

							if (isMounted) {
								setAddresses(result);
								setReverseGeocodeError(false);
							}
						} catch {
							if (isMounted) {
								setReverseGeocodeError(true);
							}
						}
					},
				);
			} catch {
				if (isMounted) {
					setPermissionDenied(true);
				}
			} finally {
				if (isMounted) {
					setIsResolving(false);
				}
			}
		};

		void startWatchers();

		return () => {
			isMounted = false;
			headingSubscription?.remove();
			locationSubscription?.remove();
		};
	}, []);

	const value = useMemo(
		() => ({
			currentDate,
			heading,
			location,
			addresses,
			permissionDenied,
			isResolving,
			reverseGeocodeError,
		}),
		[
			currentDate,
			heading,
			location,
			addresses,
			permissionDenied,
			isResolving,
			reverseGeocodeError,
		],
	);

	return (
		<GeospatialContext.Provider value={value}>
			{children}
		</GeospatialContext.Provider>
	);
}

export function useGeospatial() {
	const context = useContext(GeospatialContext);

	if (!context) {
		throw new Error("useGeospatial must be used within GeospatialProvider");
	}

	return context;
}

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
import { Linking } from "react-native";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import {
	Modal,
	ModalBackdrop,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
} from "@/components/ui/modal";
import { Text } from "@/components/ui/text";

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

				headingSubscription = await Location.watchHeadingAsync(nextHeading => {
					if (isMounted) {
						setHeading(nextHeading);
					}
				});

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

			<Modal isOpen={permissionDenied} onClose={() => {}} useRNModal>
				<ModalBackdrop />
				<ModalContent>
					<ModalHeader className="flex-col items-start gap-1">
						<Heading size="md" className="text-base text-gray-950">
							Localização necessária
						</Heading>
						<Text className="text-sm text-gray-500">
							O aplicativo precisa de acesso à sua localização para funcionar
							corretamente. Habilite nas configurações do dispositivo.
						</Text>
					</ModalHeader>
					<ModalBody />
					<ModalFooter>
						<Button
							className="flex-1 bg-lime-800 rounded-md"
							onPress={() => Linking.openSettings()}
						>
							<ButtonText>Abrir configurações</ButtonText>
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
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

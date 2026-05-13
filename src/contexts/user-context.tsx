import { useRouter } from "expo-router";
import {
	createContext,
	type PropsWithChildren,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";
import { setAuthToken } from "@/libs/api/oikos-api";
import {
	getV1Profiles,
	postV1UsersAuth,
	postV1UsersRegister,
} from "@/libs/client";
import type { Profile } from "@/libs/types/profile";

type UserContextValue = {
	user: Profile | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	signIn: (data: { email: string; password: string }) => Promise<void>;
	signUp: (data: { email: string; password: string }) => Promise<void>;
	signOut: () => void;
};

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: PropsWithChildren) {
	const [user, setUser] = useState<Profile | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	const router = useRouter();

	const signIn = useCallback(
		async (data: { email: string; password: string }) => {
			setIsLoading(true);
			try {
				const authResponse = await postV1UsersAuth({
					body: { email: data.email, password: data.password },
				});

				const token = authResponse.data?.token;
				if (!token) throw new Error("Token não recebido");

				setAuthToken(token);
				setIsAuthenticated(true);

				const response = await getV1Profiles();
				const profile = response.data?.profile;
				console.log(profile);
				if (profile) {
					setUser(profile);
					router.push("/(tabs)/(home)");
				} else {
					router.push("/(tabs)/(home)/profile");
				}
			} finally {
				setIsLoading(false);
			}
		},
		[router],
	);

	const signUp = useCallback(
		async (data: { email: string; password: string }) => {
			setIsLoading(true);
			try {
				await postV1UsersRegister({
					body: { email: data.email, password: data.password },
				});
			} finally {
				setIsLoading(false);
			}
		},
		[],
	);

	const signOut = useCallback(() => {
		setAuthToken(null);
		setUser(null);
		setIsAuthenticated(false);
	}, []);

	const value = useMemo(
		() => ({
			user,
			isAuthenticated: isAuthenticated,
			isLoading,
			signIn,
			signUp,
			signOut,
		}),
		[user, isLoading, signIn, signUp, signOut, isAuthenticated],
	);

	return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUserContext() {
	const context = useContext(UserContext);

	if (!context) {
		throw new Error("useUserContext must be used within UserProvider");
	}

	return context;
}

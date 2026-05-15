import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useRouter } from "expo-router";
import {
	createContext,
	type PropsWithChildren,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";
import { toast } from "@/components/toast";
import { setAuthToken } from "@/libs/api/oikos-api";
import {
	getV1Profiles,
	postV1UsersAuth,
	postV1UsersRegister,
} from "@/libs/client";
import type { User } from "@/libs/types/user";

type UserContextValue = {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	signIn: (data: { email: string; password: string }) => Promise<void>;
	signUp: (data: { email: string; password: string }) => Promise<void>;
	signOut: () => void;
	updateUserProfile: (data: Partial<User>) => void;
};

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: PropsWithChildren) {
	const [user, setUser] = useState<User | null>(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	const router = useRouter();

	const updateUserProfile = useCallback((data: Partial<User>) => {
		setUser(prev => (prev ? { ...prev, ...data } : (data as User)));
	}, []);

	const signInMutation = useMutation({
		mutationFn: async (data: { email: string; password: string }) => {
			const authResponse = await postV1UsersAuth({
				body: { email: data.email, password: data.password },
			});

			const token = authResponse.data?.token;
			if (!token) throw new Error("Token não recebido");

			setAuthToken(token);
			return await getV1Profiles();
		},
		onSuccess: response => {
			setIsAuthenticated(true);
			const profile = response.data?.profile;

			if (profile) {
				const user = {
					profile,
				};
				setUser(user);
				toast.success("Autenticado");
				router.push("/(tabs)/(home)");
			} else {
				toast.success("Autenticado", "Agora finalize o seu cadastro.");
				router.push("/(tabs)/(home)/profile");
			}
		},
		onError: error => {
			console.error(error);
			if (error instanceof AxiosError) {
				switch (error.response?.data.code) {
					case "INVALID_CREDENTIALS":
						toast.error(
							"Verifique suas credenciais",
							"Os dados estão incorretos ou não existem.",
						);
						break;
					default:
						toast.error("Verifique suas credenciais");
				}
			} else {
				toast.error(
					"Erro na autenticação",
					"Caso o erro persista, entre em contato com a nossa equipe!",
				);
				console.error("SignIn Error:", error);
			}
		},
	});

	const signUpMutation = useMutation({
		mutationFn: async (data: { email: string; password: string }) => {
			return await postV1UsersRegister({
				body: { email: data.email, password: data.password },
			});
		},
		onError: error => {
			console.error("SignUp Error:", error);
		},
	});

	const signOut = useCallback(() => {
		setAuthToken(null);
		setUser(null);
		setIsAuthenticated(false);
	}, []);

	const value = useMemo(
		() => ({
			user,
			isAuthenticated,
			isLoading: signInMutation.isPending || signUpMutation.isPending,
			signIn: async (data: { email: string; password: string }) => {
				await signInMutation.mutateAsync(data);
			},
			signUp: async (data: { email: string; password: string }) => {
				await signUpMutation.mutateAsync(data);
			},
			signOut,
			updateUserProfile,
		}),
		[
			user,
			isAuthenticated,
			signInMutation,
			signUpMutation,
			signOut,
			updateUserProfile,
		],
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

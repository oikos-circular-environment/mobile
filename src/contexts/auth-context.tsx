import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useRouter } from "expo-router";
import {
	createContext,
	type PropsWithChildren,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { toast } from "@/components/toast";
import {
	getAuthToken,
	setAuthToken,
	setOnUnauthenticated,
	setRefreshToken,
} from "@/libs/api/oikos-api";
import {
	getV1Profiles,
	postV1AuthLogin,
	postV1UsersRegister,
} from "@/libs/oikos-sdk";
import type { User } from "@/libs/types/user";

type AuthContextValue = {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	signIn: (data: { email: string; password: string }) => Promise<void>;
	signUp: (data: { email: string; password: string }) => Promise<void>;
	signOut: () => void;
	updateUserProfile: (data: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthContextProvider({ children }: PropsWithChildren) {
	const [user, setUser] = useState<User | null>(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isInitializing, setIsInitializing] = useState(true);

	const router = useRouter();

	const {
		isLoading: isLoadingProfile,
		isError,
		refetch,
	} = useQuery({
		queryKey: ["user", "profile"],
		queryFn: async () => {
			const response = await getV1Profiles();
			const profile = response.data?.profile;
			setIsAuthenticated(true);
			if (profile) {
				setUser({ profile } as User);
			}
			return profile;
		},
		enabled: false,
	});

	useEffect(() => {
		async function loadStorageData() {
			try {
				const tokenValue = getAuthToken();

				if (tokenValue) {
					await refetch();
				}
			} catch (error) {
				console.error("Error loading stored token:", error);
			} finally {
				setIsInitializing(false);
			}
		}

		loadStorageData();
	}, [refetch]);

	const updateUserProfile = useCallback((data: Partial<User>) => {
		setUser(prev => (prev ? { ...prev, ...data } : (data as User)));
	}, []);

	const signInMutation = useMutation({
		mutationKey: ["sign-in"],
		mutationFn: async (data: { email: string; password: string }) => {
			const authResponse = await postV1AuthLogin({
				body: { email: data.email, password: data.password },
			});

			const { token, refreshToken } = authResponse.data ?? {};
			if (!token || !refreshToken) throw new Error("Token não recebido");

			setAuthToken(token);
			setRefreshToken(refreshToken);

			const response = await getV1Profiles();
			return response.data;
		},
		onSuccess: data => {
			setIsAuthenticated(true);
			const profile = data?.profile;

			if (profile) {
				setUser({ profile } as User);
				router.push("/(tabs)/(home)");
			} else {
				toast.success(
					"Autenticado",
					"Por favor, preencha as informações no seu cadastro.",
				);
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
		mutationKey: ["sign-up"],
		mutationFn: async (data: { email: string; password: string }) => {
			return await postV1UsersRegister({
				body: { email: data.email, password: data.password },
			});
		},
		onSuccess: () => {
			router.push("/sign-in");
			toast.success(
				"Conta criada",
				"Agora, informe os dados para fazer o login.",
			);
		},
		onError: error => {
			toast.error("Erro ao criar a conta", "Verfique os dados incluidos!");
			console.error("SignUp Error:", error);
		},
	});

	const signOut = useCallback(() => {
		setAuthToken(null);
		setRefreshToken(null);
		setUser(null);
		setIsAuthenticated(false);
		router.navigate("/(tabs)/(home)");
		toast.success("Você foi deslogado com sucesso!");
	}, [router]);

	useEffect(() => {
		setOnUnauthenticated(() => {
			setUser(null);
			setIsAuthenticated(false);
			toast.info("Sessão expirada", "Faça o login novamente.");
			router.push("/sign-in");
		});
		return () => setOnUnauthenticated(null);
	}, [router]);

	useEffect(() => {
		if (isError) {
			toast.info("Você não está autenticado, faça seu login novamente.");
		}
	}, [isError]);

	useEffect(() => {
		if (!isInitializing && isAuthenticated && user === null) {
			toast.warning(
				"Finalize seu cadastro",
				"Para mantermos um lugar seguro, precisamos que preencha as informações.",
			);
			router.push("/(tabs)/(home)/profile");
		}
	}, [isInitializing, isAuthenticated, user, router]);

	const value = useMemo(
		() => ({
			user,
			isAuthenticated,
			isLoading:
				isInitializing ||
				isLoadingProfile ||
				signInMutation.isPending ||
				signUpMutation.isPending,
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
			isInitializing,
			isLoadingProfile,
			signInMutation,
			signUpMutation,
			signOut,
			updateUserProfile,
		],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
	const context = useContext(AuthContext);

	if (!context) {
		throw new Error("useAuthContext must be used within AuthContextProvider");
	}

	return context;
}

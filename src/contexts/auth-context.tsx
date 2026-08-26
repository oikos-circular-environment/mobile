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
	getRefreshToken,
	setAuthToken,
	setOnUnauthenticated,
	setRefreshToken,
} from "@/libs/api/oikos-api";
import {
	deleteV1UsersMe,
	getV1Profiles,
	getV1UsersMe,
	patchV1UsersMeCancelDeletion,
	patchV1UsersMeChangePassword,
	postV1AuthLogin,
	postV1AuthLogout,
	postV1UsersRegister,
} from "@/libs/oikos-sdk";
import { sessionBus } from "@/libs/session-bus";
import type { Account, User } from "@/libs/types/user";

type ChangePasswordInput = {
	currentPassword: string;
	newPassword: string;
};

type AuthContextValue = {
	user: User | null;
	account: Account | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	needsProfileCompletion: boolean;
	deletionScheduledAt: Date | null;
	signIn: (data: { email: string; password: string }) => void;
	signUp: (data: { email: string; password: string }) => void;
	signOut: () => Promise<void>;
	requestDeletion: () => void;
	cancelDeletion: () => void;
	changePassword: (
		data: ChangePasswordInput,
		options?: { onSuccess?: () => void },
	) => void;
	isRequestingDeletion: boolean;
	isCancellingDeletion: boolean;
	isChangingPassword: boolean;
	updateUserProfile: (data: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthContextProvider({ children }: PropsWithChildren) {
	const [user, setUser] = useState<User | null>(null);
	const [account, setAccount] = useState<Account | null>(null);
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
			const [profileResponse, userResponse] = await Promise.all([
				getV1Profiles(),
				getV1UsersMe(),
			]);
			const profile = profileResponse.data?.profile;
			const userAccount = userResponse.data?.user ?? null;
			setIsAuthenticated(true);
			setAccount(userAccount);
			if (profile && userAccount) {
				setUser({ account: userAccount, profile } as User);
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

			await Promise.all([setAuthToken(token), setRefreshToken(refreshToken)]);

			const [profileResponse, userResponse] = await Promise.all([
				getV1Profiles(),
				getV1UsersMe(),
			]);
			return {
				profile: profileResponse.data?.profile,
				account: userResponse.data?.user,
			};
		},
		onSuccess: data => {
			setIsAuthenticated(true);
			const profile = data?.profile;
			const userAccount = data?.account ?? null;
			setAccount(userAccount);

			if (profile && userAccount) {
				setUser({ account: userAccount, profile } as User);
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

	const requestDeletionMutation = useMutation({
		mutationKey: ["request-deletion"],
		mutationFn: async () => {
			const response = await deleteV1UsersMe();
			return response.data;
		},
		onSuccess: data => {
			if (data?.deleted_at) {
				setAccount(prev =>
					prev ? { ...prev, deleted_at: data.deleted_at } : prev,
				);
				setUser(prev =>
					prev
						? {
								...prev,
								account: { ...prev.account, deleted_at: data.deleted_at },
							}
						: prev,
				);
			}
			toast.success(
				"Exclusão agendada",
				"Sua conta será excluída em 90 dias. Você pode cancelar a qualquer momento.",
			);
		},
		onError: () => {
			toast.error("Erro ao solicitar exclusão", "Tente novamente mais tarde.");
		},
	});

	const cancelDeletionMutation = useMutation({
		mutationKey: ["cancel-deletion"],
		mutationFn: async () => {
			const response = await patchV1UsersMeCancelDeletion();
			return response.data;
		},
		onSuccess: () => {
			setAccount(prev => (prev ? { ...prev, deleted_at: null } : prev));
			setUser(prev =>
				prev
					? { ...prev, account: { ...prev.account, deleted_at: null } }
					: prev,
			);
			toast.success("Exclusão cancelada", "Sua conta não será mais excluída.");
		},
		onError: () => {
			toast.error("Erro ao cancelar exclusão", "Tente novamente mais tarde.");
		},
	});

	const changePasswordMutation = useMutation({
		mutationKey: ["change-password"],
		mutationFn: async ({
			currentPassword,
			newPassword,
		}: ChangePasswordInput) => {
			const response = await patchV1UsersMeChangePassword({
				body: {
					current_password: currentPassword,
					new_password: newPassword,
				},
			});
			return response.data;
		},
		onSuccess: async data => {
			// A troca de senha derruba as outras sessões; o par novo mantém este
			// dispositivo logado.
			if (data?.token && data?.refreshToken) {
				await Promise.all([
					setAuthToken(data.token),
					setRefreshToken(data.refreshToken),
				]);
			}
			toast.success(
				"Senha alterada",
				"Suas outras sessões foram desconectadas.",
			);
		},
		onError: error => {
			if (error instanceof AxiosError) {
				switch (error.response?.data.code) {
					case "INVALID_CREDENTIALS":
						toast.error(
							"Senha atual incorreta",
							"Confira a senha atual e tente novamente.",
						);
						return;
					case "SAME_PASSWORD":
						toast.error(
							"Escolha outra senha",
							"A nova senha precisa ser diferente da atual.",
						);
						return;
				}
			}
			toast.error("Erro ao alterar a senha", "Tente novamente mais tarde.");
		},
	});

	const signOut = useCallback(async () => {
		// Best-effort: revoga o refresh token no servidor. O header vai explícito
		// porque a sessão local é limpa logo abaixo, antes do interceptor rodar.
		const currentAuthToken = getAuthToken();
		const currentRefreshToken = getRefreshToken();

		if (currentRefreshToken) {
			postV1AuthLogout({
				body: { refreshToken: currentRefreshToken },
				headers: currentAuthToken
					? { Authorization: `Bearer ${currentAuthToken}` }
					: undefined,
			}).catch(() => {
				// Falha ao revogar não pode impedir o logout local.
			});
		}

		await Promise.all([setAuthToken(null), setRefreshToken(null)]);
		setUser(null);
		setAccount(null);
		setIsAuthenticated(false);
		sessionBus.emit();
		router.navigate("/(tabs)/(home)");
		toast.success("Você foi deslogado com sucesso!");
	}, [router]);

	useEffect(() => {
		setOnUnauthenticated(() => {
			setUser(null);
			setIsAuthenticated(false);
			sessionBus.emit();
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
			account,
			isAuthenticated,
			isLoading:
				isInitializing ||
				isLoadingProfile ||
				signInMutation.isPending ||
				signUpMutation.isPending,
			needsProfileCompletion: isAuthenticated && user === null,
			deletionScheduledAt: account?.deleted_at ?? null,
			signIn: (data: { email: string; password: string }) => {
				signInMutation.mutate(data);
			},
			signUp: (data: { email: string; password: string }) => {
				signUpMutation.mutate(data);
			},
			signOut,
			requestDeletion: () => requestDeletionMutation.mutate(),
			cancelDeletion: () => cancelDeletionMutation.mutate(),
			changePassword: (
				data: ChangePasswordInput,
				options?: { onSuccess?: () => void },
			) => {
				changePasswordMutation.mutate(data, {
					onSuccess: () => options?.onSuccess?.(),
				});
			},
			isRequestingDeletion: requestDeletionMutation.isPending,
			isCancellingDeletion: cancelDeletionMutation.isPending,
			isChangingPassword: changePasswordMutation.isPending,
			updateUserProfile,
		}),
		[
			user,
			account,
			isAuthenticated,
			isInitializing,
			isLoadingProfile,
			signInMutation,
			signUpMutation,
			signOut,
			requestDeletionMutation,
			cancelDeletionMutation,
			changePasswordMutation,
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

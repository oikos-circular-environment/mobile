import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
	createContext,
	type PropsWithChildren,
	useContext,
	useMemo,
} from "react";
import { toast } from "@/components/toast";
import type {
	GetV1CompaniesByIdAddressesResponse,
	GetV1CompaniesByIdBusinessHoursResponse,
	GetV1CompaniesByIdServicesResponse,
	GetV1CompaniesByIdWastesResponse,
	GetV1CompaniesResponse,
	PutV1CompaniesByIdAddressesData,
	PutV1CompaniesByIdBusinessHoursData,
	PutV1CompaniesByIdServicesData,
	PutV1CompaniesByIdWastesData,
} from "@/libs/oikos-sdk";
import {
	getV1Companies,
	getV1CompaniesByIdAddresses,
	getV1CompaniesByIdBusinessHours,
	getV1CompaniesByIdServices,
	getV1CompaniesByIdWastes,
	putV1CompaniesById,
	putV1CompaniesByIdAddresses,
	putV1CompaniesByIdBusinessHours,
	putV1CompaniesByIdServices,
	putV1CompaniesByIdWastes,
} from "@/libs/oikos-sdk";

export type Company = GetV1CompaniesResponse["companies"][number];
export type Address = GetV1CompaniesByIdAddressesResponse["address"];
export type BusinessHour =
	GetV1CompaniesByIdBusinessHoursResponse["business_hours"][number];
export type Service = GetV1CompaniesByIdServicesResponse["services"][number];
export type Waste = GetV1CompaniesByIdWastesResponse["wastes"][number];

type AddressPayload = PutV1CompaniesByIdAddressesData["body"];
type BusinessHoursPayload = PutV1CompaniesByIdBusinessHoursData["body"];
type ServicesPayload = PutV1CompaniesByIdServicesData["body"];
type WastesPayload = PutV1CompaniesByIdWastesData["body"];

type CompanyPayload = {
	identity?: string;
	identity_type?: "CPF" | "CNPJ";
	company_type?: "ONG" | "COMPANY" | "GOVERNMENT" | "COLLECTOR";
	status?: boolean;
	is_headquarters?: boolean;
	business_name?: string | null;
	corporate_name?: string;
	accept_appointments?: boolean;
	email?: string | null;
	phones?: string[];
	started_activity_in?: unknown;
	description?: string | null;
};

type UserCompanyContextValue = {
	company: Company | null | undefined;
	isLoadingCompany: boolean;
	saveCompany: (data: CompanyPayload) => Promise<void>;
	isSavingCompany: boolean;

	address: Address | undefined;
	isLoadingAddress: boolean;
	saveAddress: (data: AddressPayload) => Promise<void>;
	isSavingAddress: boolean;

	businessHours: BusinessHour[] | undefined;
	isLoadingBusinessHours: boolean;
	saveBusinessHours: (payload: BusinessHoursPayload) => Promise<void>;
	isSavingBusinessHours: boolean;

	services: Service[] | undefined;
	isLoadingServices: boolean;
	saveServices: (payload: ServicesPayload) => Promise<void>;
	isSavingServices: boolean;

	wastes: Waste[] | undefined;
	isLoadingWastes: boolean;
	saveWastes: (payload: WastesPayload) => Promise<void>;
	isSavingWastes: boolean;
};

const UserCompanyContext = createContext<UserCompanyContextValue | null>(null);

export function UserCompanyProvider({
	children,
	companyId,
}: PropsWithChildren<{ companyId: string }>) {
	const queryClient = useQueryClient();

	const { data: companiesData, isLoading: isLoadingCompany } = useQuery({
		queryKey: ["companies"],
		queryFn: async () => {
			const res = await getV1Companies();
			return res.data;
		},
	});

	const company = useMemo(
		() => companiesData?.companies?.find(c => c.id === companyId) ?? null,
		[companiesData, companyId],
	);

	const isExistingCompany = !!companyId && companyId !== "new-company";

	const { data: addressData, isLoading: isLoadingAddress } = useQuery({
		queryKey: ["companies", companyId, "address"],
		queryFn: async () => {
			try {
				const res = await getV1CompaniesByIdAddresses({
					path: { id: companyId },
				});
				return res.data;
			} catch (error) {
				if (error instanceof AxiosError && error.response?.status === 404) {
					return { address: null } as GetV1CompaniesByIdAddressesResponse;
				}
				throw error;
			}
		},
		enabled: isExistingCompany,
	});

	const { data: businessHoursData, isLoading: isLoadingBusinessHours } =
		useQuery({
			queryKey: ["companies", companyId, "business-hours"],
			queryFn: async () => {
				try {
					const res = await getV1CompaniesByIdBusinessHours({
						path: { id: companyId },
					});
					return res.data;
				} catch (error) {
					if (error instanceof AxiosError && error.response?.status === 404) {
						return {
							business_hours: [],
						} as GetV1CompaniesByIdBusinessHoursResponse;
					}
					throw error;
				}
			},
			enabled: isExistingCompany,
		});

	const { data: servicesData, isLoading: isLoadingServices } = useQuery({
		queryKey: ["companies", companyId, "services"],
		queryFn: async () => {
			try {
				const res = await getV1CompaniesByIdServices({
					path: { id: companyId },
				});
				return res.data;
			} catch (error) {
				if (error instanceof AxiosError && error.response?.status === 404) {
					return { services: [] } as GetV1CompaniesByIdServicesResponse;
				}
				throw error;
			}
		},
		enabled: isExistingCompany,
	});

	const { data: wastesData, isLoading: isLoadingWastes } = useQuery({
		queryKey: ["companies", companyId, "wastes"],
		queryFn: async () => {
			try {
				const res = await getV1CompaniesByIdWastes({
					path: { id: companyId },
				});
				return res.data;
			} catch (error) {
				if (error instanceof AxiosError && error.response?.status === 404) {
					return { wastes: [] } as GetV1CompaniesByIdWastesResponse;
				}
				throw error;
			}
		},
		enabled: isExistingCompany,
	});

	const companyMutation = useMutation({
		mutationFn: async (payload: CompanyPayload) =>
			putV1CompaniesById({ path: { id: companyId }, body: payload }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["companies"] });
			toast.success("Empresa salva com sucesso!");
		},
		onError: () => {
			toast.error("Erro ao salvar empresa", "Tente novamente.");
		},
	});

	const addressMutation = useMutation({
		mutationFn: (payload: AddressPayload) =>
			putV1CompaniesByIdAddresses({ path: { id: companyId }, body: payload }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["companies", companyId, "address"],
			});
			toast.success("Endereço salvo com sucesso!");
		},
		onError: () => {
			toast.error("Erro ao salvar endereço", "Tente novamente.");
		},
	});

	const businessHoursMutation = useMutation({
		mutationFn: (payload: BusinessHoursPayload) =>
			putV1CompaniesByIdBusinessHours({
				path: { id: companyId },
				body: payload,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["companies", companyId, "business-hours"],
			});
			toast.success("Horários salvos com sucesso!");
		},
		onError: () => {
			toast.error("Erro ao salvar horários", "Tente novamente.");
		},
	});

	const servicesMutation = useMutation({
		mutationFn: (payload: ServicesPayload) =>
			putV1CompaniesByIdServices({ path: { id: companyId }, body: payload }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["companies", companyId, "services"],
			});
			toast.success("Serviços salvos com sucesso!");
		},
		onError: () => {
			toast.error("Erro ao salvar serviços", "Tente novamente.");
		},
	});

	const wastesMutation = useMutation({
		mutationFn: (payload: WastesPayload) =>
			putV1CompaniesByIdWastes({ path: { id: companyId }, body: payload }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["companies", companyId, "wastes"],
			});
			toast.success("Resíduos salvos com sucesso!");
		},
		onError: () => {
			toast.error("Erro ao salvar resíduos", "Tente novamente.");
		},
	});

	const value = useMemo<UserCompanyContextValue>(
		() => ({
			company,
			isLoadingCompany,
			saveCompany: async data => {
				await companyMutation.mutateAsync(data);
			},
			isSavingCompany: companyMutation.isPending,

			address: addressData?.address,
			isLoadingAddress,
			saveAddress: async data => {
				await addressMutation.mutateAsync(data);
			},
			isSavingAddress: addressMutation.isPending,

			businessHours: businessHoursData?.business_hours,
			isLoadingBusinessHours,
			saveBusinessHours: async payload => {
				await businessHoursMutation.mutateAsync(payload);
			},
			isSavingBusinessHours: businessHoursMutation.isPending,

			services: servicesData?.services,
			isLoadingServices,
			saveServices: async payload => {
				await servicesMutation.mutateAsync(payload);
			},
			isSavingServices: servicesMutation.isPending,

			wastes: wastesData?.wastes,
			isLoadingWastes,
			saveWastes: async payload => {
				await wastesMutation.mutateAsync(payload);
			},
			isSavingWastes: wastesMutation.isPending,
		}),
		[
			company,
			isLoadingCompany,
			companyMutation,
			addressData,
			isLoadingAddress,
			addressMutation,
			businessHoursData,
			isLoadingBusinessHours,
			businessHoursMutation,
			servicesData,
			isLoadingServices,
			servicesMutation,
			wastesData,
			isLoadingWastes,
			wastesMutation,
		],
	);

	return (
		<UserCompanyContext.Provider value={value}>
			{children}
		</UserCompanyContext.Provider>
	);
}

export function useUserCompanyContext() {
	const context = useContext(UserCompanyContext);
	if (!context) {
		throw new Error(
			"useUserCompanyContext must be used within UserCompanyProvider",
		);
	}
	return context;
}

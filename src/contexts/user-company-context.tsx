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
	GetV1CompaniesAddressesResponse,
	GetV1CompaniesBusinessHoursResponse,
	GetV1CompaniesResponse,
	GetV1CompaniesServicesResponse,
	GetV1CompaniesWastesResponse,
	PostV1CompaniesData,
	PutV1CompaniesAddressesData,
	PutV1CompaniesBusinessHoursData,
	PutV1CompaniesServicesData,
	PutV1CompaniesWastesData,
} from "@/libs/oikos-sdk";
import {
	getV1Companies,
	getV1CompaniesAddresses,
	getV1CompaniesBusinessHours,
	getV1CompaniesServices,
	getV1CompaniesWastes,
	postV1Companies,
	putV1Companies,
	putV1CompaniesAddresses,
	putV1CompaniesBusinessHours,
	putV1CompaniesServices,
	putV1CompaniesWastes,
} from "@/libs/oikos-sdk";

export type Company = NonNullable<GetV1CompaniesResponse["company"]>;
export type Address = GetV1CompaniesAddressesResponse["address"];
export type BusinessHour =
	GetV1CompaniesBusinessHoursResponse["business_hours"][number];
export type Service = GetV1CompaniesServicesResponse["services"][number];
export type Waste = GetV1CompaniesWastesResponse["wastes"][number];

type CompanyPayload = PostV1CompaniesData["body"];
type AddressPayload = PutV1CompaniesAddressesData["body"];
type BusinessHoursPayload = PutV1CompaniesBusinessHoursData["body"];
type ServicesPayload = PutV1CompaniesServicesData["body"];
type WastesPayload = PutV1CompaniesWastesData["body"];

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

	completionRate: number;
};

const UserCompanyContext = createContext<UserCompanyContextValue | null>(null);

export function UserCompanyProvider({ children }: PropsWithChildren) {
	const queryClient = useQueryClient();

	const { data: companyData, isLoading: isLoadingCompany } = useQuery({
		queryKey: ["company"],
		queryFn: async () => {
			const res = await getV1Companies();
			return res.data;
		},
	});

	const { data: addressData, isLoading: isLoadingAddress } = useQuery({
		queryKey: ["company", "address"],
		queryFn: async () => {
			try {
				const res = await getV1CompaniesAddresses();
				return res.data;
			} catch (error) {
				if (error instanceof AxiosError && error.response?.status === 404) {
					return { address: null } as GetV1CompaniesAddressesResponse;
				}
				throw error;
			}
		},
	});

	const { data: businessHoursData, isLoading: isLoadingBusinessHours } =
		useQuery({
			queryKey: ["company", "business-hours"],
			queryFn: async () => {
				try {
					const res = await getV1CompaniesBusinessHours();
					return res.data;
				} catch (error) {
					if (error instanceof AxiosError && error.response?.status === 404) {
						return {
							business_hours: [],
						} as GetV1CompaniesBusinessHoursResponse;
					}
					throw error;
				}
			},
		});

	const { data: servicesData, isLoading: isLoadingServices } = useQuery({
		queryKey: ["company", "services"],
		queryFn: async () => {
			try {
				const res = await getV1CompaniesServices();
				return res.data;
			} catch (error) {
				if (error instanceof AxiosError && error.response?.status === 404) {
					return { services: [] } as GetV1CompaniesServicesResponse;
				}
				throw error;
			}
		},
	});

	const { data: wastesData, isLoading: isLoadingWastes } = useQuery({
		queryKey: ["company", "wastes"],
		queryFn: async () => {
			try {
				const res = await getV1CompaniesWastes();
				return res.data;
			} catch (error) {
				if (error instanceof AxiosError && error.response?.status === 404) {
					return { wastes: [] } as GetV1CompaniesWastesResponse;
				}
				throw error;
			}
		},
	});

	const companyMutation = useMutation({
		mutationFn: async (payload: CompanyPayload) => {
			if (companyData?.company == null) {
				return postV1Companies({ body: payload });
			}
			return putV1Companies({ body: payload });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["company"] });
			toast.success("Empresa salva com sucesso!");
		},
		onError: () => {
			toast.error("Erro ao salvar empresa", "Tente novamente.");
		},
	});

	const addressMutation = useMutation({
		mutationFn: (payload: AddressPayload) =>
			putV1CompaniesAddresses({ body: payload }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["company", "address"] });
			toast.success("Endereço salvo com sucesso!");
		},
		onError: () => {
			toast.error("Erro ao salvar endereço", "Tente novamente.");
		},
	});

	const businessHoursMutation = useMutation({
		mutationFn: (payload: BusinessHoursPayload) =>
			putV1CompaniesBusinessHours({ body: payload }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["company", "business-hours"],
			});
			toast.success("Horários salvos com sucesso!");
		},
		onError: () => {
			toast.error("Erro ao salvar horários", "Tente novamente.");
		},
	});

	const servicesMutation = useMutation({
		mutationFn: (payload: ServicesPayload) =>
			putV1CompaniesServices({ body: payload }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["company", "services"] });
			toast.success("Serviços salvos com sucesso!");
		},
		onError: () => {
			toast.error("Erro ao salvar serviços", "Tente novamente.");
		},
	});

	const wastesMutation = useMutation({
		mutationFn: (payload: WastesPayload) =>
			putV1CompaniesWastes({ body: payload }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["company", "wastes"] });
			toast.success("Resíduos salvos com sucesso!");
		},
		onError: () => {
			toast.error("Erro ao salvar resíduos", "Tente novamente.");
		},
	});

	const completionRate = useMemo(() => {
		let rate = 0;
		if (companyData?.company != null) rate += 20;
		if (addressData?.address != null) rate += 20;
		if ((businessHoursData?.business_hours?.length ?? 0) > 0) rate += 20;
		if ((servicesData?.services?.length ?? 0) > 0) rate += 20;
		if ((wastesData?.wastes?.length ?? 0) > 0) rate += 20;
		return rate;
	}, [companyData, addressData, businessHoursData, servicesData, wastesData]);

	const value = useMemo<UserCompanyContextValue>(
		() => ({
			company: companyData?.company,
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

			completionRate,
		}),
		[
			companyData,
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
			completionRate,
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

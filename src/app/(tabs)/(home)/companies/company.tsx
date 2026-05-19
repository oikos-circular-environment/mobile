import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { format, parse, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle, Search } from "lucide-react-native";
import { useEffect } from "react";
import { Controller, type SubmitHandler, useForm } from "react-hook-form";
import { KeyboardAvoidingView, ScrollView, View } from "react-native";
import { z } from "zod";
import { CompanyFormSkeleton } from "@/components/companies/skeletons";
import { toast } from "@/components/toast";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	FormControl,
	FormControlError,
	FormControlErrorIcon,
	FormControlErrorText,
	FormControlHelper,
	FormControlHelperText,
	FormControlLabel,
	FormControlLabelText,
} from "@/components/ui/form-control";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useUserCompanyContext } from "@/contexts/user-company-context";
import { getCnpj } from "@/libs/brasil-api-sdk";
import { mask } from "@/libs/mask";

const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
const phoneRegex = /^\(\d{2}\)\s(\d\s)?\d{4}-\d{4}$/;

const companySchema = z.object({
	identity: z
		.string()
		.min(1, "Documento é obrigatório")
		.regex(cnpjRegex, "CNPJ deve estar no formato: 00.000.000/0000-00"),
	corporateName: z.string().min(1, "Razão social é obrigatória"),
	businessName: z.string().min(1, "Nome fantasia é obrigatório"),
	email: z.email("E-mail deve ser válido"),
	phones: z
		.union([z.array(z.string()), z.null()])
		.optional()
		.refine(
			v => !v?.length || phoneRegex.test(v[0] || ""),
			"Telefone deve estar no formato: (00) 0 0000-0000",
		),
	startedActivityIn: z
		.date()
		.refine(d => d <= new Date(), "Data não pode ser no futuro"),
	companyType: z
		.enum(["ONG", "COMPANY", "GOVERNMENT", "COLLECTOR"])
		.default("COMPANY"),
	identityType: z.enum(["CPF", "CNPJ"]).default("CNPJ"),
	status: z.boolean(),
	isHeadquarters: z.boolean(),
	acceptAppointments: z.boolean(),
});

type CompanyFormData = z.infer<typeof companySchema>;

export default function CompanyGeneralInfoScreen() {
	const { company, isLoadingCompany, saveCompany, isSavingCompany } =
		useUserCompanyContext();

	const {
		control,
		handleSubmit,
		reset,
		setValue,
		formState: { errors, isDirty },
	} = useForm({
		resolver: zodResolver(companySchema),
		defaultValues: {
			identity: "",
			corporateName: "",
			businessName: "",
			email: "",
			phones: [""],
			startedActivityIn: new Date(),
			companyType: "COMPANY" as const,
			identityType: "CNPJ" as const,
			status: true,
			isHeadquarters: true,
			acceptAppointments: false,
		},
	});

	const getCnpjMutation = useMutation({
		mutationKey: ["get", "cnpj", "brasil-api"],
		mutationFn: async ({ cnpj }: { cnpj: string }) => {
			const response = await getCnpj({ path: { cnpj } });
			return response.data;
		},
		onSuccess: data => {
			if (!data) return;
			if (data.razao_social) setValue("corporateName", data.razao_social);
			if (data.nome_fantasia) setValue("businessName", data.nome_fantasia);
			if (data.email) setValue("email", data.email);
			if (data.ddd_telefone_1) {
				setValue("phones", [mask.phoneBr(data.ddd_telefone_1)]);
			}
			if (data.data_inicio_atividade) {
				setValue("startedActivityIn", parseISO(data.data_inicio_atividade));
			}
		},
		onError: () => {
			toast.error(
				"CNPJ não encontrado",
				"Verifique o número e tente novamente.",
			);
		},
	});

	const onPressSearchCnpj = () => {
		const digits = (control._formValues.identity as string).replace(/\D/g, "");
		if (digits.length !== 14) {
			toast.error("CNPJ inválido", "O CNPJ deve conter 14 dígitos.");
			return;
		}
		getCnpjMutation.mutate({ cnpj: digits });
	};

	useEffect(() => {
		if (company) {
			reset({
				identity: company.identity,
				corporateName: company.corporate_name,
				businessName: company.business_name ?? "",
				email: company.email ?? "",
				phones: company.phones ?? [""],
				startedActivityIn: new Date(company.started_activity_in),
				companyType: company.company_type,
				identityType: company.identity_type,
				status: company.status,
				isHeadquarters: company.is_headquarters,
				acceptAppointments: company.accept_appointments,
			});
		}
	}, [company, reset]);

	const handleFormSubmit: SubmitHandler<CompanyFormData> = async data => {
		try {
			await saveCompany({
				identity: data.identity,
				identity_type: data.identityType,
				corporate_name: data.corporateName,
				business_name: data.businessName || null,
				email: data.email || null,
				phones: data.phones ?? [],
				started_activity_in: data.startedActivityIn,
				company_type: data.companyType,
				status: data.status,
				is_headquarters: data.isHeadquarters,
				accept_appointments: data.acceptAppointments,
			});
		} catch {
			// handled by context mutation's onError
		}
	};

	if (isLoadingCompany) {
		return <CompanyFormSkeleton />;
	}

	return (
		<KeyboardAvoidingView behavior="padding" className="flex-1">
			<ScrollView
				className="flex-1 bg-white"
				contentContainerClassName="p-4 pb-8"
			>
				<View className="gap-4">
					<Card className="shadow-none gap-3">
						<FormControl isInvalid={!!errors.identity} className="gap-2">
							<FormControlLabel>
								<FormControlLabelText>CNPJ</FormControlLabelText>
							</FormControlLabel>
							<Controller
								control={control}
								name="identity"
								render={({ field: { value, onChange, onBlur } }) => (
									<Input className="h-8">
										<InputField
											value={value}
											onBlur={onBlur}
											onChangeText={text => onChange(mask.cnpj(text))}
											keyboardType="number-pad"
											placeholder="00.000.000/0000-00"
										/>
										<InputSlot className="pr-3" onPress={onPressSearchCnpj}>
											<InputIcon
												as={getCnpjMutation.isPending ? Spinner : Search}
											/>
										</InputSlot>
									</Input>
								)}
							/>
							<FormControlError>
								<FormControlErrorIcon as={AlertCircle} className="size-4" />
								<FormControlErrorText>
									{errors.identity?.message}
								</FormControlErrorText>
							</FormControlError>
						</FormControl>

						<FormControl isInvalid={!!errors.corporateName} className="gap-2">
							<FormControlLabel>
								<FormControlLabelText>Razão Social</FormControlLabelText>
							</FormControlLabel>
							<Controller
								control={control}
								name="corporateName"
								render={({ field: { value, onChange, onBlur } }) => (
									<Input>
										<InputField
											value={value}
											onBlur={onBlur}
											onChangeText={onChange}
											placeholder="Nome completo da empresa"
										/>
									</Input>
								)}
							/>
							<FormControlError>
								<FormControlErrorIcon as={AlertCircle} className="size-4" />
								<FormControlErrorText>
									{errors.corporateName?.message}
								</FormControlErrorText>
							</FormControlError>
						</FormControl>

						<FormControl isInvalid={!!errors.businessName} className="gap-2">
							<FormControlLabel>
								<FormControlLabelText>Nome Fantasia</FormControlLabelText>
							</FormControlLabel>
							<Controller
								control={control}
								name="businessName"
								render={({ field: { value, onChange, onBlur } }) => (
									<Input>
										<InputField
											value={value ?? ""}
											onBlur={onBlur}
											onChangeText={onChange}
											placeholder="Nome fantasia (opcional)"
										/>
									</Input>
								)}
							/>
							<FormControlError>
								<FormControlErrorIcon as={AlertCircle} className="size-4" />
								<FormControlErrorText>
									{errors.businessName?.message}
								</FormControlErrorText>
							</FormControlError>
						</FormControl>

						<FormControl isInvalid={!!errors.email} className="gap-2">
							<FormControlLabel>
								<FormControlLabelText>E-mail</FormControlLabelText>
							</FormControlLabel>
							<Controller
								control={control}
								name="email"
								render={({ field: { value, onChange, onBlur } }) => (
									<Input>
										<InputField
											value={value ?? ""}
											onBlur={onBlur}
											onChangeText={onChange}
											placeholder="contato@empresa.com"
											keyboardType="email-address"
											autoCapitalize="none"
										/>
									</Input>
								)}
							/>
							<FormControlError>
								<FormControlErrorIcon as={AlertCircle} className="size-4" />
								<FormControlErrorText>
									{errors.email?.message}
								</FormControlErrorText>
							</FormControlError>
						</FormControl>

						<FormControl isInvalid={!!errors.phones} className="gap-2">
							<FormControlLabel>
								<FormControlLabelText>Telefone Principal</FormControlLabelText>
							</FormControlLabel>
							<Controller
								control={control}
								name="phones"
								render={({ field: { value, onChange, onBlur } }) => (
									<Input>
										<InputField
											value={value?.[0] ?? ""}
											onBlur={onBlur}
											onChangeText={v =>
												onChange(v.length ? [mask.phoneBr(v)] : null)
											}
											placeholder="(00) 00000-0000"
											keyboardType="phone-pad"
										/>
									</Input>
								)}
							/>
							<FormControlError>
								<FormControlErrorIcon as={AlertCircle} className="size-4" />
								<FormControlErrorText>
									{errors.phones?.message}
								</FormControlErrorText>
							</FormControlError>
						</FormControl>

						<FormControl
							isInvalid={!!errors.startedActivityIn}
							className="gap-2"
						>
							<FormControlLabel>
								<FormControlLabelText>
									Data de Início da atividade
								</FormControlLabelText>
							</FormControlLabel>
							<Controller
								control={control}
								name="startedActivityIn"
								render={({ field: { value, onChange, onBlur } }) => (
									<Input>
										<InputField
											value={format(value, "dd/MM/yyyy", { locale: ptBR })}
											onBlur={onBlur}
											onChangeText={dateStr => {
												try {
													const parsed = parse(
														dateStr,
														"dd/MM/yyyy",
														new Date(),
														{ locale: ptBR },
													);
													if (!Number.isNaN(parsed.getTime())) {
														onChange(parsed);
													}
												} catch {
													// invalid date format
												}
											}}
											placeholder="DD/MM/YYYY"
											keyboardType="decimal-pad"
										/>
									</Input>
								)}
							/>
							<FormControlHelper>
								<FormControlHelperText>
									Formato: DD/MM/YYYY
								</FormControlHelperText>
							</FormControlHelper>
							<FormControlError>
								<FormControlErrorIcon as={AlertCircle} className="size-4" />
								<FormControlErrorText>
									{errors.startedActivityIn?.message}
								</FormControlErrorText>
							</FormControlError>
						</FormControl>

						<HStack className="gap-2 mt-4">
							<Button
								variant="outline"
								className="flex-1"
								onPress={() => reset()}
								isDisabled={!isDirty || isSavingCompany}
							>
								<ButtonText>Cancelar</ButtonText>
							</Button>

							<Button
								className="flex-1"
								onPress={handleSubmit(handleFormSubmit)}
								isDisabled={!isDirty || isSavingCompany}
							>
								<ButtonText>Salvar</ButtonText>
								{isSavingCompany && <ButtonIcon as={Spinner} />}
							</Button>
						</HStack>
					</Card>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

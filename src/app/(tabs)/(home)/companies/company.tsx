import { zodResolver } from "@hookform/resolvers/zod";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle } from "lucide-react-native";
import { useEffect } from "react";
import { Controller, type SubmitHandler, useForm } from "react-hook-form";
import { ActivityIndicator, KeyboardAvoidingView, ScrollView, View } from "react-native";
import { z } from "zod";
import { Button, ButtonText } from "@/components/ui/button";
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
import { Input, InputField } from "@/components/ui/input";
import { useUserCompanyContext } from "@/contexts/user-company-context";

const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
const phoneRegex = /^(\(\d{2}\)\s?)?\d{4,5}-?\d{4}$/;

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
			"Telefone deve estar no formato: (00) 00000-0000",
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
		formState: { errors },
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
		return (
			<View className="flex-1 items-center justify-center bg-white">
				<ActivityIndicator size="large" />
			</View>
		);
	}

	return (
		<KeyboardAvoidingView behavior="padding" className="flex-1">
			<ScrollView
				className="flex-1 bg-white"
				contentContainerClassName="p-4 pb-8"
			>
				<View className="gap-4">
					<Card className="shadow-none gap-3">
						<Controller
							control={control}
							name="identity"
							render={({ field: { value, onChange } }) => (
								<FormControl isInvalid={!!errors.identity} className="gap-2">
									<FormControlLabel>
										<FormControlLabelText>CNPJ</FormControlLabelText>
									</FormControlLabel>
									<Input>
										<InputField
											value={value}
											onChangeText={onChange}
											placeholder="00.000.000/0000-00"
											keyboardType="decimal-pad"
										/>
									</Input>
									<FormControlError>
										<FormControlErrorIcon as={AlertCircle} className="size-4" />
										<FormControlErrorText>
											{errors.identity?.message}
										</FormControlErrorText>
									</FormControlError>
								</FormControl>
							)}
						/>

						<Controller
							control={control}
							name="corporateName"
							render={({ field: { value, onChange } }) => (
								<FormControl
									isInvalid={!!errors.corporateName}
									className="gap-2"
								>
									<FormControlLabel>
										<FormControlLabelText>Razão Social</FormControlLabelText>
									</FormControlLabel>
									<Input>
										<InputField
											value={value}
											onChangeText={onChange}
											placeholder="Nome completo da empresa"
										/>
									</Input>
									<FormControlError>
										<FormControlErrorIcon as={AlertCircle} className="size-4" />
										<FormControlErrorText>
											{errors.corporateName?.message}
										</FormControlErrorText>
									</FormControlError>
								</FormControl>
							)}
						/>

						<Controller
							control={control}
							name="businessName"
							render={({ field: { value, onChange } }) => (
								<FormControl
									isInvalid={!!errors.businessName}
									className="gap-2"
								>
									<FormControlLabel>
										<FormControlLabelText>Nome Fantasia</FormControlLabelText>
									</FormControlLabel>
									<Input>
										<InputField
											value={value ?? ""}
											onChangeText={onChange}
											placeholder="Nome fantasia (opcional)"
										/>
									</Input>
									<FormControlError>
										<FormControlErrorIcon as={AlertCircle} className="size-4" />
										<FormControlErrorText>
											{errors.businessName?.message}
										</FormControlErrorText>
									</FormControlError>
								</FormControl>
							)}
						/>

						<Controller
							control={control}
							name="email"
							render={({ field: { value, onChange } }) => (
								<FormControl isInvalid={!!errors.email} className="gap-2">
									<FormControlLabel>
										<FormControlLabelText>E-mail</FormControlLabelText>
									</FormControlLabel>
									<Input>
										<InputField
											value={value ?? ""}
											onChangeText={onChange}
											placeholder="contato@empresa.com"
											keyboardType="email-address"
											autoCapitalize="none"
										/>
									</Input>
									<FormControlError>
										<FormControlErrorIcon as={AlertCircle} className="size-4" />
										<FormControlErrorText>
											{errors.email?.message}
										</FormControlErrorText>
									</FormControlError>
								</FormControl>
							)}
						/>

						<Controller
							control={control}
							name="phones"
							render={({ field: { value, onChange } }) => (
								<FormControl isInvalid={!!errors.phones} className="gap-2">
									<FormControlLabel>
										<FormControlLabelText>
											Telefone Principal
										</FormControlLabelText>
									</FormControlLabel>
									<Input>
										<InputField
											value={value?.[0] ?? ""}
											onChangeText={v => onChange(v.length ? [v] : null)}
											placeholder="(00) 00000-0000"
											keyboardType="phone-pad"
										/>
									</Input>
									<FormControlError>
										<FormControlErrorIcon as={AlertCircle} className="size-4" />
										<FormControlErrorText>
											{errors.phones?.message}
										</FormControlErrorText>
									</FormControlError>
								</FormControl>
							)}
						/>

						<Controller
							control={control}
							name="startedActivityIn"
							render={({ field: { value, onChange } }) => (
								<FormControl
									isInvalid={!!errors.startedActivityIn}
									className="gap-2"
								>
									<FormControlLabel>
										<FormControlLabelText>
											Data de Início da Atividade
										</FormControlLabelText>
									</FormControlLabel>
									<Input>
										<InputField
											value={format(value, "dd/MM/yyyy", { locale: ptBR })}
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
							)}
						/>

						<Button
							className="mt-4"
							onPress={handleSubmit(handleFormSubmit)}
							isDisabled={isSavingCompany}
						>
							<ButtonText>Salvar dados da empresa</ButtonText>
						</Button>
					</Card>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

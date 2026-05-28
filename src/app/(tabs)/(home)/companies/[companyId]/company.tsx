import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parse, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams } from "expo-router";
import {
	AlertCircle,
	Check,
	ChevronDown,
	FactoryIcon,
	PencilIcon,
	Search,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Controller, type SubmitHandler, useForm } from "react-hook-form";
import { KeyboardAvoidingView, ScrollView, TouchableOpacity, View } from "react-native";
import { z } from "zod";
import { CompanyFormSkeleton } from "@/components/companies/skeletons";
import { colors } from "@/components/style/colors";
import { toast } from "@/components/toast";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Checkbox,
	CheckboxIcon,
	CheckboxIndicator,
	CheckboxLabel,
} from "@/components/ui/checkbox";
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
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import {
	Select,
	SelectBackdrop,
	SelectContent,
	SelectDragIndicator,
	SelectDragIndicatorWrapper,
	SelectIcon,
	SelectInput,
	SelectItem,
	SelectPortal,
	SelectTrigger,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { useAuthContext } from "@/contexts/auth-context";
import { useUserCompanyContext } from "@/contexts/user-company-context";
import { getCnpj } from "@/libs/brasil-api-sdk";
import { cnpjRegex, cpfRegex, mask, phoneRegex } from "@/libs/mask";
import { postV1CompaniesByIdAvatar } from "@/libs/oikos-sdk";
import {
	companyTypeOptions,
	identityTypeOptions,
} from "@/libs/types/companies";

const companySchema = z
	.object({
		identity: z.string().min(1, "Documento é obrigatório"),
		corporate_name: z.string().min(1, "Razão social é obrigatória"),
		business_name: z.string().nullable(),
		email: z.string().email("E-mail deve ser válido"),
		phones: z
			.array(z.string())
			.min(1, "Telefone principal é obrigatório")
			.superRefine((val, ctx) => {
				if (!val[0] || !phoneRegex.test(val[0])) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: "Telefone principal inválido",
						path: [0],
					});
				}
				if (val[1] && !phoneRegex.test(val[1])) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: "Telefone secundário inválido",
						path: [1],
					});
				}
			}),
		started_activity_in: z
			.date()
			.nullable()
			.refine(d => !d || d <= new Date(), "Data não pode ser no futuro"),
		company_type: z
			.enum(["ONG", "COMPANY", "GOVERNMENT", "COLLECTOR"])
			.default("COMPANY"),
		identity_type: z.enum(["CPF", "CNPJ"]).default("CNPJ"),
		status: z.boolean(),
		isHeadquarters: z.boolean(),
		accept_appointments: z.boolean(),
	})
	.superRefine((data, ctx) => {
		if (data.identity_type === "CNPJ") {
			if (!cnpjRegex.test(data.identity)) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "CNPJ deve estar no formato: 00.000.000/0000-00",
					path: ["identity"],
				});
			}
		} else if (data.identity_type === "CPF") {
			if (!cpfRegex.test(data.identity)) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "CPF deve estar no formato: 000.000.000-00",
					path: ["identity"],
				});
			}
		}
	});

type CompanyFormData = z.infer<typeof companySchema>;

export default function CompanyGeneralInfoScreen() {
	const { user } = useAuthContext();
	const [useProfileData, setUseProfileData] = useState(false);
	const { company, isLoadingCompany, saveCompany, isSavingCompany } =
		useUserCompanyContext();
	const { companyId } = useLocalSearchParams<{ companyId: string }>();
	const queryClient = useQueryClient();
	const selectedAsset = useRef<ImagePicker.ImagePickerAsset | null>(null);

	const {
		control,
		handleSubmit,
		reset,
		setValue,
		watch,
		formState: { errors, isDirty },
	} = useForm({
		resolver: zodResolver(companySchema),
		defaultValues: {
			identity: "",
			corporate_name: "",
			business_name: "",
			email: "",
			phones: ["", ""],
			started_activity_in: new Date(),
			company_type: "COMPANY" as const,
			identity_type: "CNPJ" as const,
			status: true,
			isHeadquarters: true,
			accept_appointments: false,
		},
	});

	const identity_type = watch("identity_type");

	const getCnpjMutation = useMutation({
		mutationKey: ["get", "cnpj", "brasil-api"],
		mutationFn: async ({ cnpj }: { cnpj: string }) => {
			const response = await getCnpj({ path: { cnpj } });
			return response.data;
		},
		onSuccess: data => {
			if (!data) return;
			if (data.razao_social) setValue("corporate_name", data.razao_social);
			if (data.nome_fantasia) setValue("business_name", data.nome_fantasia);
			if (data.email) setValue("email", data.email);
			if (data.ddd_telefone_1) {
				setValue("phones", [mask.phoneBr(data.ddd_telefone_1)]);
			}
			if (data.data_inicio_atividade) {
				setValue("started_activity_in", parseISO(data.data_inicio_atividade));
			}
		},
		onError: () => {
			toast.error(
				"CNPJ não encontrado",
				"Verifique o número e tente novamente.",
			);
		},
	});

	const avatarMutation = useMutation({
		mutationFn: async (asset: ImagePicker.ImagePickerAsset) => {
			const formData = new FormData();
			const file = {
				uri: asset.uri,
				name: asset.fileName ?? "image.jpg",
				type: asset.mimeType ?? "image/jpeg",
			} as unknown as Blob;
			formData.append("file", file);
			const res = await postV1CompaniesByIdAvatar({
				path: { id: companyId },
				body: formData as any,
			});
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["companies"] });
		},
		onError: () => {
			toast.error("Erro ao salvar imagem", "Ocorreu um problema ao atualizar a foto.");
		},
	});

	const onPickAvatar = async () => {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.8,
		});
		if (!result.canceled && result.assets[0]) {
			selectedAsset.current = result.assets[0];
			avatarMutation.mutate(result.assets[0]);
		}
	};

	const onPressSearchCnpj = () => {
		if (identity_type !== "CNPJ") return;
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
				corporate_name: company.corporate_name,
				business_name: company.business_name ?? "",
				email: company.email ?? "",
				phones: [company.phones?.[0] ?? "", company.phones?.[1] ?? ""],
				started_activity_in: company.started_activity_in
					? new Date(company.started_activity_in)
					: null,
				company_type: company.company_type,
				identity_type: company.identity_type,
				status: company.status,
				isHeadquarters: company.is_headquarters,
				accept_appointments: company.accept_appointments,
			});
			setUseProfileData(false);
		}
	}, [company, reset]);

	useEffect(() => {
		if (useProfileData && user?.profile) {
			setValue("identity_type", "CPF");
			setValue("identity", mask.cpf(user.profile.cpf));
			setValue("corporate_name", user.profile.full_name);
			setValue("business_name", user.profile.full_name);
			if (user.profile.phone) {
				setValue("phones", [mask.phoneBr(user.profile.phone), ""]);
			}
		}
	}, [useProfileData, user, setValue]);

	const handleFormSubmit: SubmitHandler<CompanyFormData> = async data => {
		const corporate_name = data.corporate_name;
		const business_name =
			data.identity_type === "CPF" ? data.corporate_name : data.business_name;

		await saveCompany({
			identity: data.identity,
			identity_type: data.identity_type,
			corporate_name: corporate_name,
			business_name: business_name || null,
			email: data.email || null,
			phones: data.phones.filter(p => !!p),
			started_activity_in: data.started_activity_in,
			company_type: data.company_type,
			status: data.status,
			is_headquarters: data.isHeadquarters,
			accept_appointments: data.accept_appointments,
		});
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
					<View className="items-center py-2">
						<TouchableOpacity onPress={onPickAvatar} activeOpacity={0.8}>
							<View className="relative">
								{avatarMutation.isPending ? (
									<View className="size-24 rounded-full bg-secondary items-center justify-center">
										<Spinner />
									</View>
								) : company?.avatar ? (
									<Image
										source={{ uri: company.avatar.url }}
										className="size-24 rounded-full"
										contentFit="cover"
									/>
								) : (
									<View className="size-24 rounded-full bg-secondary items-center justify-center">
										<FactoryIcon size={36} color={colors.lime[800]} strokeWidth={1.5} />
									</View>
								)}
								<View className="absolute bottom-0 right-0 size-7 rounded-full bg-primary items-center justify-center">
									<PencilIcon size={14} color={colors.white} />
								</View>
							</View>
						</TouchableOpacity>
					</View>

					<Card className="bg-secondary shadow-none">
						<View className="flex-row items-center justify-between gap-4">
							<View className="size-15 items-center justify-center rounded-lg bg-primary">
								<FactoryIcon color={colors.white} size={20} />
							</View>
							<View className="flex-1 gap-1">
								<Heading className="text-lg">Empresas</Heading>
								<Text className="text-sm ">
									Estes dados serão expostos na plataforma, o preenchimento com
									informações reais trazem mais confiabilidade para os usuários
									da plataforma.
								</Text>
							</View>
						</View>
					</Card>

					<Card className="shadow-none">
						<FormControl>
							<Checkbox
								value="useProfile"
								id="use-profile"
								isChecked={useProfileData}
								onChange={setUseProfileData}
							>
								<CheckboxIndicator>
									<CheckboxIcon as={Check} />
								</CheckboxIndicator>
								<CheckboxLabel className="flex-1">
									Utilizar os dados do meu perfil
								</CheckboxLabel>
							</Checkbox>
							<FormControlHelper className="ml-7">
								<FormControlHelperText>
									O seu CPF não será exposto publicamente. Garantimos a
									privacidade dos seus dados pessoais.
								</FormControlHelperText>
							</FormControlHelper>
						</FormControl>
					</Card>

					<Card className="shadow-none gap-3">
						<FormControl isInvalid={!!errors.identity_type} className="gap-2">
							<FormControlLabel>
								<FormControlLabelText>Tipo de identidade</FormControlLabelText>
							</FormControlLabel>
							<Controller
								control={control}
								name="identity_type"
								render={({ field: { value, onChange } }) => (
									<View className="flex-row gap-2">
										{identityTypeOptions.map(identity_type => {
											const isSelected = identity_type.value === value;
											return (
												<Button
													key={identity_type.value}
													variant={isSelected ? "default" : "outline"}
													className="flex-1 will-change-variable"
													onPress={() => onChange(identity_type.value)}
												>
													<ButtonText>{identity_type.label}</ButtonText>
												</Button>
											);
										})}
									</View>
								)}
							/>

							<FormControlError>
								<FormControlErrorIcon as={AlertCircle} className="size-4" />
								<FormControlErrorText>
									{errors.identity_type?.message}
								</FormControlErrorText>
							</FormControlError>
						</FormControl>

						<FormControl isInvalid={!!errors.identity} className="gap-2">
							<FormControlLabel>
								<FormControlLabelText>Identidade</FormControlLabelText>
							</FormControlLabel>

							<Controller
								control={control}
								name="identity"
								render={({ field: { value, onChange, onBlur } }) => (
									<Input className="h-8">
										<InputField
											value={value}
											onBlur={onBlur}
											onChangeText={text =>
												onChange(
													identity_type === "CNPJ"
														? mask.cnpj(text)
														: mask.cpf(text),
												)
											}
											keyboardType="number-pad"
											placeholder={
												identity_type === "CNPJ"
													? "00.000.000/0000-00"
													: "000.000.000-00"
											}
										/>

										{identity_type === "CNPJ" && (
											<InputSlot className="pr-3" onPress={onPressSearchCnpj}>
												<InputIcon
													as={getCnpjMutation.isPending ? Spinner : Search}
												/>
											</InputSlot>
										)}
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

						<FormControl isInvalid={!!errors.company_type} className="gap-2">
							<FormControlLabel>
								<FormControlLabelText>Tipo de empresa</FormControlLabelText>
							</FormControlLabel>
							<Controller
								control={control}
								name="company_type"
								render={({ field: { value, onChange } }) => (
									<Select
										onValueChange={onChange}
										selectedValue={
											companyTypeOptions.find(c => c.value === value)?.label ||
											value
										}
									>
										<SelectTrigger
											variant="outline"
											size="md"
											className="justify-between"
										>
											<SelectInput placeholder="Selecione o tipo" />
											<SelectIcon className="mr-3" as={ChevronDown} />
										</SelectTrigger>
										<SelectPortal>
											<SelectBackdrop />
											<SelectContent>
												<SelectDragIndicatorWrapper>
													<SelectDragIndicator />
												</SelectDragIndicatorWrapper>
												{companyTypeOptions.map(companyType => (
													<SelectItem
														key={companyType.value}
														value={companyType.value}
														label={companyType.label}
													/>
												))}
											</SelectContent>
										</SelectPortal>
									</Select>
								)}
							/>
						</FormControl>

						<FormControl isInvalid={!!errors.corporate_name} className="gap-2">
							<FormControlLabel>
								<FormControlLabelText>
									{identity_type === "CNPJ" ? "Razão social" : "Nome completo"}
								</FormControlLabelText>
							</FormControlLabel>
							<Controller
								control={control}
								name="corporate_name"
								render={({ field: { value, onChange, onBlur } }) => (
									<Input>
										<InputField
											value={value}
											onBlur={onBlur}
											onChangeText={text => {
												onChange(text);
												if (identity_type === "CPF") {
													setValue("business_name", text);
												}
											}}
											placeholder={
												identity_type === "CNPJ"
													? "Nome completo da empresa"
													: "Seu nome completo"
											}
										/>
									</Input>
								)}
							/>
							<FormControlError>
								<FormControlErrorIcon as={AlertCircle} className="size-4" />
								<FormControlErrorText>
									{errors.corporate_name?.message}
								</FormControlErrorText>
							</FormControlError>
						</FormControl>

						{identity_type === "CNPJ" && (
							<FormControl isInvalid={!!errors.business_name} className="gap-2">
								<FormControlLabel>
									<FormControlLabelText>Nome fantasia</FormControlLabelText>
								</FormControlLabel>
								<Controller
									control={control}
									name="business_name"
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
										{errors.business_name?.message}
									</FormControlErrorText>
								</FormControlError>
							</FormControl>
						)}

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

						<FormControl isInvalid={!!errors.phones?.[0]} className="gap-2">
							<FormControlLabel>
								<FormControlLabelText>Telefone Principal</FormControlLabelText>
							</FormControlLabel>
							<Controller
								control={control}
								name="phones.0"
								render={({ field: { value, onChange, onBlur } }) => (
									<Input>
										<InputField
											value={value ?? ""}
											onBlur={onBlur}
											onChangeText={v => onChange(mask.phoneBr(v))}
											placeholder="(00) 00000-0000"
											keyboardType="phone-pad"
										/>
									</Input>
								)}
							/>
							<FormControlError>
								<FormControlErrorIcon as={AlertCircle} className="size-4" />
								<FormControlErrorText>
									{errors.phones?.[0]?.message}
								</FormControlErrorText>
							</FormControlError>
						</FormControl>

						<FormControl isInvalid={!!errors.phones?.[1]} className="gap-2">
							<FormControlLabel>
								<FormControlLabelText>Telefone Secundário</FormControlLabelText>
							</FormControlLabel>
							<Controller
								control={control}
								name="phones.1"
								render={({ field: { value, onChange, onBlur } }) => (
									<Input>
										<InputField
											value={value ?? ""}
											onBlur={onBlur}
											onChangeText={v => onChange(mask.phoneBr(v))}
											placeholder="(00) 00000-0000 (opcional)"
											keyboardType="phone-pad"
										/>
									</Input>
								)}
							/>
							<FormControlError>
								<FormControlErrorIcon as={AlertCircle} className="size-4" />
								<FormControlErrorText>
									{errors.phones?.[1]?.message}
								</FormControlErrorText>
							</FormControlError>
						</FormControl>

						<FormControl
							isInvalid={!!errors.started_activity_in}
							className="gap-2"
						>
							<FormControlLabel>
								<FormControlLabelText>
									Data de Início da atividade
								</FormControlLabelText>
							</FormControlLabel>
							<Controller
								control={control}
								name="started_activity_in"
								render={({ field: { value, onChange, onBlur } }) => (
									<Input>
										<InputField
											value={
												value
													? format(value, "dd/MM/yyyy", { locale: ptBR })
													: ""
											}
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
									{errors.started_activity_in?.message}
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

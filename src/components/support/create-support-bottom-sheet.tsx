import BottomSheet, {
	BottomSheetBackdrop,
	type BottomSheetBackdropProps,
	BottomSheetScrollView,
	BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { zodResolver } from "@hookform/resolvers/zod";
import type * as ImagePicker from "expo-image-picker";
import { AlertCircleIcon } from "lucide-react-native";
import { forwardRef, useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { z } from "zod";
import { colors } from "@/components/style/colors";
import { AttachmentPickerRow } from "@/components/support/attachment-row";
import { useCreateSupportRequest } from "@/components/support/hooks/use-create-support-request";
import { Button, ButtonText } from "@/components/ui/button";
import {
	FormControl,
	FormControlError,
	FormControlErrorIcon,
	FormControlErrorText,
	FormControlLabel,
	FormControlLabelText,
} from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { useAuthContext } from "@/contexts/auth-context";
import { usePickValidatedMedia } from "@/hooks/use-pick-validated-media";
import { getRecentAppErrors } from "@/libs/moderation/app-errors-store";
import { getSupportDeviceInfo } from "@/libs/moderation/device-info";
import type {
	SupportEnvironment,
	SupportRequestType,
} from "@/libs/types/support";
import { supportTypeOptions } from "@/libs/types/support";
import { cn } from "@/libs/utils";

// BottomSheet só reposiciona sobre o teclado se o campo for o
// BottomSheetTextInput dele — o InputField do gluestack renderiza um
// TextInput comum, que não é rastreado. Por isso os campos vão estilizados
// via style, já que o componente não passa pelo NativeWind.
const textInputStyle = {
	flex: 1,
	height: "100%",
	fontSize: 16,
	color: colors.gray[900],
} as const;

const supportFormSchema = z.object({
	email: z.string().email("E-mail inválido."),
	title: z.string().min(10, "O título precisa ter pelo menos 10 caracteres."),
	description: z
		.string()
		.min(20, "A descrição precisa ter pelo menos 20 caracteres."),
});

type SupportFormValues = z.infer<typeof supportFormSchema>;

type CreateSupportBottomSheetProps = {
	onSuccess: () => void;
};

export const CreateSupportBottomSheet = forwardRef<
	BottomSheet,
	CreateSupportBottomSheetProps
>(function CreateSupportBottomSheet({ onSuccess }, ref) {
	const { account } = useAuthContext();

	const [selectedType, setSelectedType] = useState<SupportRequestType>("ERROR");
	const [selectedAssets, setSelectedAssets] = useState<
		ImagePicker.ImagePickerAsset[]
	>([]);

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors, isValid },
	} = useForm<SupportFormValues>({
		resolver: zodResolver(supportFormSchema),
		defaultValues: { email: account?.email ?? "", title: "", description: "" },
		mode: "onTouched",
	});

	const { pickValidatedMedia, isPicking } = usePickValidatedMedia();
	const createSupportRequest = useCreateSupportRequest();

	const backdropComponent = useCallback(
		(props: BottomSheetBackdropProps) => (
			<BottomSheetBackdrop
				{...props}
				appearsOnIndex={0}
				disappearsOnIndex={-1}
				pressBehavior="close"
			/>
		),
		[],
	);

	const handlePickMedia = async () => {
		const validAssets = await pickValidatedMedia(
			selectedAssets.map(a => a.uri),
			{
				requestPermission: true,
				mediaTypes: ["images", "videos"],
				allowsMultipleSelection: true,
				quality: 0.85,
				orderedSelection: true,
			},
		);
		if (validAssets.length > 0) {
			setSelectedAssets(prev => [...prev, ...validAssets]);
		}
	};

	const onSubmit = handleSubmit(async data => {
		const recentErrors =
			selectedType === "ERROR" ? await getRecentAppErrors(10) : [];
		const lastError = recentErrors[0] ?? null;
		const environment: SupportEnvironment | undefined =
			selectedType === "ERROR"
				? {
						...getSupportDeviceInfo(),
						...(lastError && {
							last_error: {
								message: lastError.message,
								stack: lastError.stack,
								component_stack: lastError.component_stack,
								occurred_at: lastError.occurred_at,
							},
						}),
						...(recentErrors.length > 0 && {
							last_errors: recentErrors.map(({ id, ...error }) => error),
						}),
					}
				: undefined;

		createSupportRequest.mutate(
			{
				body: {
					title: data.title,
					description: data.description,
					type: selectedType,
					reporter_email: data.email,
					environment,
				},
				attachments: selectedAssets,
			},
			{
				onSuccess: () => {
					reset();
					setSelectedType("ERROR");
					setSelectedAssets([]);
					onSuccess();
				},
			},
		);
	});

	return (
		<BottomSheet
			ref={ref}
			index={-1}
			enableDynamicSizing
			enablePanDownToClose
			keyboardBehavior="interactive"
			keyboardBlurBehavior="restore"
			android_keyboardInputMode="adjustResize"
			backdropComponent={backdropComponent}
		>
			<BottomSheetScrollView
				keyboardShouldPersistTaps="handled"
				contentContainerStyle={{
					gap: 16,
					paddingHorizontal: 16,
					paddingBottom: 32,
				}}
			>
				<Heading size="xl">Abrir suporte</Heading>

				<View className="flex-row gap-2">
					{supportTypeOptions.map(option => {
						const isSelected = selectedType === option.value;
						const Icon = option.icon;
						return (
							<Pressable
								key={option.value}
								onPress={() => setSelectedType(option.value)}
								className={cn(
									"flex-1 flex-row items-center justify-center gap-1.5 rounded-xl px-2 py-3",
									isSelected
										? "bg-lime-800"
										: "border border-gray-200 bg-gray-50",
								)}
							>
								{Icon ? (
									<Icon
										size={16}
										color={isSelected ? colors.white : colors.gray[700]}
										strokeWidth={2}
									/>
								) : null}
								<Text
									className={cn(
										"text-xs font-semibold",
										isSelected ? "text-white" : "text-gray-700",
									)}
								>
									{option.label}
								</Text>
							</Pressable>
						);
					})}
				</View>

				<Controller
					control={control}
					name="email"
					render={({ field: { onChange, onBlur, value } }) => (
						<FormControl isInvalid={!!errors.email}>
							<FormControlLabel>
								<FormControlLabelText className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
									E-mail
								</FormControlLabelText>
							</FormControlLabel>
							<Input>
								<BottomSheetTextInput
									value={value}
									onChangeText={onChange}
									onBlur={onBlur}
									placeholder="seu@email.com"
									placeholderTextColor={colors.gray[500]}
									keyboardType="email-address"
									autoCapitalize="none"
									style={textInputStyle}
								/>
							</Input>
							{errors.email ? (
								<FormControlError>
									<FormControlErrorIcon as={AlertCircleIcon} />
									<FormControlErrorText>
										{errors.email.message}
									</FormControlErrorText>
								</FormControlError>
							) : null}
						</FormControl>
					)}
				/>

				<Controller
					control={control}
					name="title"
					render={({ field: { onChange, onBlur, value } }) => (
						<FormControl isInvalid={!!errors.title}>
							<FormControlLabel>
								<FormControlLabelText className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
									Título
								</FormControlLabelText>
							</FormControlLabel>
							<Input>
								<BottomSheetTextInput
									value={value}
									onChangeText={onChange}
									onBlur={onBlur}
									placeholder="Resuma o problema em poucas palavras"
									placeholderTextColor={colors.gray[500]}
									style={textInputStyle}
								/>
							</Input>
							{errors.title ? (
								<FormControlError>
									<FormControlErrorIcon as={AlertCircleIcon} />
									<FormControlErrorText>
										{errors.title.message}
									</FormControlErrorText>
								</FormControlError>
							) : null}
						</FormControl>
					)}
				/>

				<Controller
					control={control}
					name="description"
					render={({ field: { onChange, onBlur, value } }) => (
						<FormControl isInvalid={!!errors.description}>
							<FormControlLabel>
								<FormControlLabelText className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
									Descrição
								</FormControlLabelText>
							</FormControlLabel>
							<Input className="min-h-[120px] items-start py-2">
								<BottomSheetTextInput
									value={value}
									onChangeText={onChange}
									onBlur={onBlur}
									placeholder="Descreva com o máximo de detalhes possível"
									placeholderTextColor={colors.gray[500]}
									multiline
									numberOfLines={5}
									textAlignVertical="top"
									style={textInputStyle}
								/>
							</Input>
							{errors.description ? (
								<FormControlError>
									<FormControlErrorIcon as={AlertCircleIcon} />
									<FormControlErrorText>
										{errors.description.message}
									</FormControlErrorText>
								</FormControlError>
							) : null}
						</FormControl>
					)}
				/>

				<FormControl>
					<View className="mb-2 flex-row items-center justify-between">
						<FormControlLabel>
							<FormControlLabelText className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
								Anexos
							</FormControlLabelText>
						</FormControlLabel>
						<Text className="text-xs text-gray-400">opcional</Text>
					</View>
					<AttachmentPickerRow
						assets={selectedAssets}
						onPick={() => void handlePickMedia()}
						onRemove={uri =>
							setSelectedAssets(prev => prev.filter(a => a.uri !== uri))
						}
						isPicking={isPicking}
					/>
				</FormControl>

				<Button
					className="bg-lime-800"
					disabled={createSupportRequest.isPending || !isValid}
					onPress={onSubmit}
				>
					{createSupportRequest.isPending ? (
						<Spinner size="small" />
					) : (
						<ButtonText>Enviar</ButtonText>
					)}
				</Button>
			</BottomSheetScrollView>
		</BottomSheet>
	);
});

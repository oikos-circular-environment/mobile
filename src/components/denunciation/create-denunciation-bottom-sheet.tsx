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
import { AttachmentPickerRow } from "@/components/denunciation/attachment-row";
import { useCreateDenunciation } from "@/components/denunciation/hooks/use-create-denunciation";
import { colors } from "@/components/style/colors";
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
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { useAuthContext } from "@/contexts/auth-context";
import { usePickValidatedMedia } from "@/libs/use-pick-validated-media";

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

const denunciationFormSchema = z.object({
	email: z.string().email("E-mail inválido."),
	title: z.string().min(10, "O título precisa ter pelo menos 10 caracteres."),
	description: z
		.string()
		.min(20, "A descrição precisa ter pelo menos 20 caracteres."),
});

type DenunciationFormValues = z.infer<typeof denunciationFormSchema>;

type CreateDenunciationBottomSheetProps = {
	onSuccess: () => void;
};

export const CreateDenunciationBottomSheet = forwardRef<
	BottomSheet,
	CreateDenunciationBottomSheetProps
>(function CreateDenunciationBottomSheet({ onSuccess }, ref) {
	const { account } = useAuthContext();

	const [selectedAssets, setSelectedAssets] = useState<
		ImagePicker.ImagePickerAsset[]
	>([]);

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors, isValid },
	} = useForm<DenunciationFormValues>({
		resolver: zodResolver(denunciationFormSchema),
		defaultValues: { email: account?.email ?? "", title: "", description: "" },
		mode: "onTouched",
	});

	const { pickValidatedMedia, isPicking } = usePickValidatedMedia();
	const createDenunciation = useCreateDenunciation();

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

	const onSubmit = handleSubmit(data =>
		createDenunciation.mutate(
			{
				body: {
					title: data.title,
					description: data.description,
					reporter_email: data.email,
				},
				attachments: selectedAssets,
			},
			{
				onSuccess: () => {
					reset();
					setSelectedAssets([]);
					onSuccess();
				},
			},
		),
	);

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
				<Heading size="xl">Nova denúncia</Heading>

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
					disabled={createDenunciation.isPending || !isValid}
					onPress={onSubmit}
				>
					{createDenunciation.isPending ? (
						<Spinner size="small" />
					) : (
						<ButtonText>Enviar</ButtonText>
					)}
				</Button>
			</BottomSheetScrollView>
		</BottomSheet>
	);
});

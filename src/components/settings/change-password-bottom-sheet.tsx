import BottomSheet, {
	BottomSheetBackdrop,
	type BottomSheetBackdropProps,
	BottomSheetScrollView,
	BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircleIcon, Eye, EyeOff } from "lucide-react-native";
import { forwardRef, useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { z } from "zod";
import { colors } from "@/components/style/colors";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import {
	FormControl,
	FormControlError,
	FormControlErrorIcon,
	FormControlErrorText,
	FormControlLabel,
	FormControlLabelText,
} from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { Input, InputIcon, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useAuthContext } from "@/contexts/auth-context";

const MIN_PASSWORD_LENGTH = 6;

// O sheet só reposiciona sobre o teclado se o campo for o BottomSheetTextInput
// dele — um TextInput comum (o que o InputField do gluestack renderiza) não é
// rastreado e acaba coberto. Por isso o campo vai estilizado via style, já que
// o componente não passa pelo NativeWind.
const textInputStyle = {
	flex: 1,
	height: "100%",
	fontSize: 16,
	color: colors.gray[900],
} as const;

const changePasswordSchema = z
	.object({
		currentPassword: z
			.string()
			.min(
				MIN_PASSWORD_LENGTH,
				`A senha precisa ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`,
			),
		newPassword: z
			.string()
			.min(
				MIN_PASSWORD_LENGTH,
				`A senha precisa ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`,
			),
		confirmPassword: z.string(),
	})
	.refine(data => data.newPassword !== data.currentPassword, {
		message: "A nova senha precisa ser diferente da atual.",
		path: ["newPassword"],
	})
	.refine(data => data.newPassword === data.confirmPassword, {
		message: "As senhas não conferem.",
		path: ["confirmPassword"],
	});

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

type PasswordFieldName = keyof ChangePasswordFormValues;

const fields: Array<{ name: PasswordFieldName; label: string }> = [
	{ name: "currentPassword", label: "Senha atual" },
	{ name: "newPassword", label: "Nova senha" },
	{ name: "confirmPassword", label: "Confirmar nova senha" },
];

type ChangePasswordBottomSheetProps = {
	onSuccess: () => void;
};

export const ChangePasswordBottomSheet = forwardRef<
	BottomSheet,
	ChangePasswordBottomSheetProps
>(function ChangePasswordBottomSheet({ onSuccess }, ref) {
	const { changePassword, isChangingPassword } = useAuthContext();
	const [visibleFields, setVisibleFields] = useState<
		Partial<Record<PasswordFieldName, boolean>>
	>({});

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<ChangePasswordFormValues>({
		resolver: zodResolver(changePasswordSchema),
		defaultValues: {
			currentPassword: "",
			newPassword: "",
			confirmPassword: "",
		},
	});

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

	const toggleVisibility = useCallback((field: PasswordFieldName) => {
		setVisibleFields(prev => ({ ...prev, [field]: !prev[field] }));
	}, []);

	const onSubmit = handleSubmit(values => {
		changePassword(
			{
				currentPassword: values.currentPassword,
				newPassword: values.newPassword,
			},
			{
				onSuccess: () => {
					reset();
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
				contentContainerStyle={{
					gap: 16,
					paddingHorizontal: 16,
					paddingBottom: 32,
				}}
			>
				<View className="gap-1">
					<Heading size="md" className="text-base text-gray-950">
						Mudar senha
					</Heading>
					<Text className="text-sm text-gray-500">
						Ao trocar a senha, as outras sessões são desconectadas. Este
						aparelho continua logado.
					</Text>
				</View>

				{fields.map(({ name, label }) => (
					<FormControl key={name} isInvalid={!!errors[name]} className="gap-2">
						<FormControlLabel>
							<FormControlLabelText className="text-xs font-semibold uppercase text-gray-500">
								{label}
							</FormControlLabelText>
						</FormControlLabel>
						<Controller
							control={control}
							name={name}
							render={({ field: { onChange, onBlur, value } }) => (
								<Input>
									<BottomSheetTextInput
										value={value}
										onBlur={onBlur}
										onChangeText={onChange}
										placeholder="••••••••"
										placeholderTextColor={colors.gray[500]}
										secureTextEntry={!visibleFields[name]}
										autoCapitalize="none"
										style={textInputStyle}
									/>
									<InputSlot
										onPress={() => toggleVisibility(name)}
										className="pr-1"
										testID={`toggle-${name}`}
									>
										<InputIcon
											as={visibleFields[name] ? Eye : EyeOff}
											className="text-muted-foreground"
										/>
									</InputSlot>
								</Input>
							)}
						/>
						{errors[name]?.message && (
							<FormControlError>
								<FormControlErrorIcon as={AlertCircleIcon} />
								<FormControlErrorText>
									{errors[name].message}
								</FormControlErrorText>
							</FormControlError>
						)}
					</FormControl>
				))}

				<Button size="lg" onPress={onSubmit} isDisabled={isChangingPassword}>
					<ButtonText>Salvar nova senha</ButtonText>
					{isChangingPassword && <ButtonSpinner />}
				</Button>
			</BottomSheetScrollView>
		</BottomSheet>
	);
});

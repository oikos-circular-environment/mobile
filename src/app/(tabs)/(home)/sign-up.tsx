import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useRouter } from "expo-router";
import { AlertCircleIcon, ArrowLeft, Eye, EyeOff } from "lucide-react-native";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	KeyboardAvoidingView,
	Pressable,
	ScrollView,
	StyleSheet,
	useWindowDimensions,
	View,
} from "react-native";
import { Defs, RadialGradient, Rect, Stop, Svg } from "react-native-svg";
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
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useAuthContext } from "@/contexts/auth-context";
import { useRouteInteractive } from "@/libs/use-route-interactive";

const signUpSchema = z
	.object({
		email: z.email("Digite um e-mail válido."),
		password: z.string().min(8, "A senha precisa ter no mínimo 8 caracteres."),
		confirm_password: z.string(),
	})
	.refine(data => data.password === data.confirm_password, {
		message: "As senhas não coincidem.",
		path: ["confirm_password"],
	});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function SignUpScreen() {
	useRouteInteractive();
	const { signUp, isLoading } = useAuthContext();
	const router = useRouter();
	const { width: screenWidth } = useWindowDimensions();
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<SignUpFormValues>({
		resolver: zodResolver(signUpSchema),
		defaultValues: {
			email: "",
			password: "",
			confirm_password: "",
		},
	});

	const onSubmit = (data: SignUpFormValues) => {
		signUp(data);
	};

	return (
		<KeyboardAvoidingView behavior="padding" className="flex-1">
			<ScrollView
				contentContainerClassName="flex-grow bg-white"
				showsVerticalScrollIndicator={false}
			>
				{/* Header Section */}
				<View className="h-72 rounded-b-4xl overflow-hidden">
					<Svg style={StyleSheet.absoluteFill} width={screenWidth} height={288}>
						<Defs>
							<RadialGradient
								id="headerGradient"
								cx={screenWidth * 0.5}
								cy={-10}
								r={200}
								gradientUnits="userSpaceOnUse"
							>
								<Stop offset="0%" stopColor={colors.lime[500]} />
								<Stop offset="100%" stopColor={colors.lime[800]} />
							</RadialGradient>
						</Defs>
						<Rect
							width={screenWidth}
							height={288}
							fill="url(#headerGradient)"
						/>
					</Svg>
					<View className="flex-1 p-8 justify-between">
						<Pressable
							onPress={router.back}
							className="w-10 h-10 rounded-full bg-white items-center justify-center"
						>
							<ArrowLeft size={18} color={colors.lime[800]} />
						</Pressable>
						<View className="gap-2">
							<Text
								className="text-white text-4xl"
								style={{ fontFamily: "Oswald_700Bold" }}
							>
								VAMOS CONSTRUIR O FUTURO JUNTOS!
							</Text>
							<Text
								className="text-white text-lg opacity-90"
								style={{ fontFamily: "SpaceGrotesk_400Regular" }}
							>
								Crie sua conta e comece a contribuir.
							</Text>
						</View>
					</View>
				</View>

				<View className="px-8 pt-10 pb-8 gap-6">
					<FormControl isInvalid={!!errors.email} className="gap-2">
						<FormControlLabel>
							<FormControlLabelText className="text-gray-500 font-medium">
								E-mail
							</FormControlLabelText>
						</FormControlLabel>
						<Controller
							control={control}
							name="email"
							render={({ field: { onChange, onBlur, value } }) => (
								<Input>
									<InputField
										value={value}
										onBlur={onBlur}
										onChangeText={onChange}
										placeholder="seu@email.com"
										keyboardType="email-address"
										autoCapitalize="none"
										className="text-base"
									/>
								</Input>
							)}
						/>
						{errors.email?.message && (
							<FormControlError>
								<FormControlErrorIcon as={AlertCircleIcon} />
								<FormControlErrorText>
									{errors.email.message}
								</FormControlErrorText>
							</FormControlError>
						)}
					</FormControl>

					<FormControl isInvalid={!!errors.password} className="gap-2">
						<FormControlLabel>
							<FormControlLabelText className="text-gray-500 font-medium">
								Senha
							</FormControlLabelText>
						</FormControlLabel>
						<Controller
							control={control}
							name="password"
							render={({ field: { onChange, onBlur, value } }) => (
								<Input>
									<InputField
										value={value}
										onBlur={onBlur}
										onChangeText={onChange}
										placeholder="••••••••"
										secureTextEntry={!showPassword}
										className="text-base"
									/>
									<InputSlot
										onPress={() => setShowPassword(prev => !prev)}
										className="pr-1"
										testID="toggle-password"
									>
										<InputIcon
											as={showPassword ? Eye : EyeOff}
											className="text-muted-foreground"
										/>
									</InputSlot>
								</Input>
							)}
						/>
						{errors.password?.message && (
							<FormControlError>
								<FormControlErrorIcon as={AlertCircleIcon} />
								<FormControlErrorText>
									{errors.password.message}
								</FormControlErrorText>
							</FormControlError>
						)}
					</FormControl>

					<FormControl isInvalid={!!errors.confirm_password} className="gap-2">
						<FormControlLabel>
							<FormControlLabelText className="text-gray-500 font-medium">
								Confirmar Senha
							</FormControlLabelText>
						</FormControlLabel>
						<Controller
							control={control}
							name="confirm_password"
							render={({ field: { onChange, onBlur, value } }) => (
								<Input>
									<InputField
										value={value}
										onBlur={onBlur}
										onChangeText={onChange}
										placeholder="••••••••"
										secureTextEntry={!showConfirmPassword}
										className="text-base"
									/>
									<InputSlot
										onPress={() => setShowConfirmPassword(prev => !prev)}
										className="pr-1"
										testID="toggle-confirm-password"
									>
										<InputIcon
											as={showPassword ? Eye : EyeOff}
											className="text-muted-foreground"
										/>
									</InputSlot>
								</Input>
							)}
						/>
						{errors.confirm_password?.message && (
							<FormControlError>
								<FormControlErrorIcon as={AlertCircleIcon} />
								<FormControlErrorText>
									{errors.confirm_password.message}
								</FormControlErrorText>
							</FormControlError>
						)}
					</FormControl>

					<Button
						size="lg"
						onPress={handleSubmit(onSubmit)}
						isDisabled={isLoading}
					>
						<ButtonText>Criar Conta</ButtonText>
						{isLoading && <ButtonSpinner />}
					</Button>

					<View className="flex-row justify-center gap-1 mt-4">
						<Text className="text-gray-500">Já tem uma conta?</Text>
						<Link href="/sign-in">
							<Text className="text-gray-900 font-bold">Entrar</Text>
						</Link>
					</View>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

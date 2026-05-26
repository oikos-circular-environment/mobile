import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { KeyboardAvoidingView, ScrollView, View } from "react-native";
import { z } from "zod";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import {
	FormControl,
	FormControlError,
	FormControlErrorText,
	FormControlLabel,
	FormControlLabelText,
} from "@/components/ui/form-control";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useAuthContext } from "@/contexts/auth-context";

const signUpSchema = z.object({
	email: z.string().email("Digite um e-mail válido."),
	password: z.string().min(8, "A senha precisa ter no mínimo 8 caracteres."),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function SignUpScreen() {
	const { signUp, isLoading } = useAuthContext();

	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<SignUpFormValues>({
		resolver: zodResolver(signUpSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const onSubmit = async (data: SignUpFormValues) => {
		await signUp(data);
	};

	return (
		<KeyboardAvoidingView behavior="padding" className="flex-1">
			<ScrollView
				contentContainerClassName="flex-grow bg-white"
				showsVerticalScrollIndicator={false}
			>
				{/* Header Section */}
				<View className="h-72 bg-primary p-8 rounded-b-4xl justify-center gap-2">
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
										secureTextEntry
										className="text-base"
									/>
								</Input>
							)}
						/>
						{errors.password?.message && (
							<FormControlError>
								<FormControlErrorText>
									{errors.password.message}
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

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

const signInSchema = z.object({
	email: z.string().email("Digite um e-mail válido."),
	password: z.string().min(8, "A senha precisa ter no mínimo 8 caracteres."),
});

type SignInFormValues = z.infer<typeof signInSchema>;

export default function SignInScreen() {
	const { signIn, isLoading } = useAuthContext();

	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<SignInFormValues>({
		resolver: zodResolver(signInSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const onSubmit = async (data: SignInFormValues) => {
		await signIn(data);
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
						SEJA BEM VINDO NOVAMENTE!
					</Text>
					<Text
						className="text-white text-lg opacity-90"
						style={{ fontFamily: "SpaceGrotesk_400Regular" }}
					>
						Continue a contribuir com a Economia Circular.
					</Text>
				</View>

				{/* Form Section */}
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

					{/* <Text className="text-right text-gray-900 font-semibold text-sm">
						Esqueceu a senha?
					</Text> */}

					<Button
						size="lg"
						onPress={handleSubmit(onSubmit)}
						isDisabled={isLoading}
					>
						<ButtonText>Entrar</ButtonText>
						{isLoading && <ButtonSpinner />}
					</Button>

					<View className="flex-row justify-center gap-1 mt-4">
						<Text className="text-gray-500">Não tem uma conta?</Text>
						<Link href="/sign-up">
							<Text className="text-gray-900 font-bold">Cadastre-se</Text>
						</Link>
					</View>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { AuthScreenLayout } from "@/components/auth/auth-screen-layout";
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
	email: z.email("Digite um e-mail válido."),
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
		<AuthScreenLayout
			title="Entrar na sua conta"
			subtitle="Bem-vindo de volta. Preencha seus dados."
			footer={
				<Text className="text-sm">
					Não tem uma conta?{" "}
					<Link href="/sign-up" className="font-semibold">
						Registrar-se
					</Link>
				</Text>
			}
		>
			<FormControl isInvalid={!!errors.email} className="gap-2">
				<FormControlLabel>
					<FormControlLabelText>E-mail</FormControlLabelText>
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
								placeholder="Digite seu e-mail"
								keyboardType="email-address"
								autoCapitalize="none"
							/>
						</Input>
					)}
				/>
				{errors.email?.message && (
					<FormControlError>
						<FormControlErrorText>{errors.email.message}</FormControlErrorText>
					</FormControlError>
				)}
			</FormControl>

			<FormControl isInvalid={!!errors.password} className="gap-2">
				<FormControlLabel>
					<FormControlLabelText>Senha</FormControlLabelText>
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
								placeholder="Digite sua senha"
								secureTextEntry
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
				className="mt-1 bg-primary"
				onPress={handleSubmit(onSubmit)}
				isDisabled={isLoading}
			>
				<ButtonText>Entrar</ButtonText>
				{isLoading && <ButtonSpinner />}
			</Button>
		</AuthScreenLayout>
	);
}

import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { AuthScreenLayout } from "@/components/auth/auth-screen-layout";
import { Button, ButtonText } from "@/components/ui/button";
import {
	FormControl,
	FormControlError,
	FormControlErrorText,
	FormControlLabel,
	FormControlLabelText,
} from "@/components/ui/form-control";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useUserContext } from "@/contexts/user-context";

const signUpSchema = z.object({
	email: z.string().email("Digite um e-mail válido."),
	password: z.string().min(8, "A senha precisa ter no mínimo 8 caracteres."),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function SignUpScreen() {
	const router = useRouter();
	const { signUp, isLoading } = useUserContext();

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
		try {
			await signUp(data);
			router.push({
				pathname: "/sign-in",
			});
		} catch (error) {
			console.log("Error", error);
		}
	};

	return (
		<AuthScreenLayout
			title="Criar conta"
			subtitle="Preencha seus dados para começar na Oikos."
			footer={
				<Text className="text-xs/70">
					Já possui conta?{" "}
					<Link href="/sign-in" className="font-semibold">
						Entrar
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
								className="text-base"
							/>
						</Input>
					)}
				/>
				{errors.email?.message ? (
					<FormControlError>
						<FormControlErrorText>{errors.email.message}</FormControlErrorText>
					</FormControlError>
				) : null}
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
								placeholder="Crie sua senha"
								secureTextEntry
								className="text-base"
							/>
						</Input>
					)}
				/>
				{errors.password?.message ? (
					<FormControlError>
						<FormControlErrorText>
							{errors.password.message}
						</FormControlErrorText>
					</FormControlError>
				) : null}
			</FormControl>

			<Button
				className="mt-1 bg-primary"
				onPress={handleSubmit(onSubmit)}
				isDisabled={isLoading}
			>
				<ButtonText className="text-base font-semibold">Criar conta</ButtonText>
			</Button>
		</AuthScreenLayout>
	);
}

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
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

const signUpSchema = z.object({
	name: z.string().min(3, "Digite seu nome completo."),
	email: z.email("Digite um e-mail válido."),
	password: z.string().min(8, "A senha precisa ter no mínimo 8 caracteres."),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function SignUpScreen() {
	const router = useRouter();

	const signUpMutation = useMutation({
		mutationKey: ["signup"],
		mutationFn: async () => {},
	});

	const {
		control,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<SignUpFormValues>({
		resolver: zodResolver(signUpSchema),
		defaultValues: {
			name: "",
			email: "",
			password: "",
		},
	});

	const onSubmit = (data: SignUpFormValues) => {
		router.push({
			pathname: "/verify-code",
			params: { email: data.email },
		});
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
			<FormControl isInvalid={!!errors.name} className="gap-2">
				<FormControlLabel>
					<FormControlLabelText className="text-sm">Nome</FormControlLabelText>
				</FormControlLabel>
				<Controller
					control={control}
					name="name"
					render={({ field: { onChange, onBlur, value } }) => (
						<Input>
							<InputField
								value={value}
								onBlur={onBlur}
								onChangeText={onChange}
								placeholder="Digite seu nome"
							/>
						</Input>
					)}
				/>
				{errors.name?.message ? (
					<FormControlError>
						<FormControlErrorText>{errors.name.message}</FormControlErrorText>
					</FormControlError>
				) : null}
			</FormControl>

			<FormControl isInvalid={!!errors.email} className="gap-2">
				<FormControlLabel>
					<FormControlLabelText className="text-sm">
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
								placeholder="Digite seu e-mail"
								keyboardType="email-address"
								autoCapitalize="none"
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
					<FormControlLabelText className="text-sm">Senha</FormControlLabelText>
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
				size="lg"
				className="mt-1 bg-primary"
				onPress={handleSubmit(onSubmit)}
				isDisabled={isSubmitting}
			>
				<ButtonText>Criar conta</ButtonText>
			</Button>
		</AuthScreenLayout>
	);
}

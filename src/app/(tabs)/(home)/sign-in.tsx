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
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { setAuthToken } from "@/libs/api/oikos-api";
import { postV1UsersAuth } from "@/libs/client";

const signInSchema = z.object({
	email: z.email("Digite um e-mail válido."),
	password: z.string().min(8, "A senha precisa ter no mínimo 8 caracteres."),
});

type SignInFormValues = z.infer<typeof signInSchema>;

export default function SignInScreen() {
	const router = useRouter();
	const {
		control,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<SignInFormValues>({
		resolver: zodResolver(signInSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const signInMutation = useMutation({
		mutationKey: ["sign-in"],
		mutationFn: async (data: SignInFormValues) => {
			const response = await postV1UsersAuth({
				body: {
					email: data.email,
					password: data.password,
				},
			});

			return response;
		},
		onSuccess: response => {
			const token = response.data?.token;
			if (token) {
				setAuthToken(token);
			}
			router.push("/(tabs)/(home)");
		},
		onError: error => {
			console.log("Error", error);
		},
	});

	const onSubmit = (data: SignInFormValues) => {
		signInMutation.mutate(data);
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
				isDisabled={isSubmitting || signInMutation.isPending}
			>
				<ButtonText>Entrar</ButtonText>
				{signInMutation.isPending && <Spinner size="small" />}
			</Button>
		</AuthScreenLayout>
	);
}

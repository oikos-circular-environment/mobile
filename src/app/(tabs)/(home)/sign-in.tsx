import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useRouter } from "expo-router";
import { Check, Chrome } from "lucide-react-native";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { AuthScreenLayout } from "@/components/auth/auth-screen-layout";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import {
	Checkbox,
	CheckboxIcon,
	CheckboxIndicator,
	CheckboxLabel,
} from "@/components/ui/checkbox";
import {
	FormControl,
	FormControlError,
	FormControlErrorText,
	FormControlLabel,
	FormControlLabelText,
} from "@/components/ui/form-control";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";

const signInSchema = z.object({
	email: z.email("Digite um e-mail válido."),
	password: z.string().min(8, "A senha precisa ter no mínimo 8 caracteres."),
	remember: z.boolean(),
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
			remember: true,
		},
	});

	const onSubmit = (data: SignInFormValues) => {
		router.push({
			pathname: "/verify-code",
			params: { email: data.email },
		});
	};

	return (
		<AuthScreenLayout
			title="Entrar na sua conta"
			subtitle="Bem-vindo de volta. Preencha seus dados."
			footer={
				<Text className="text-xs ">
					Não tem uma conta?{" "}
					<Link href="/sign-up" className="font-semibold">
						Registrar-se
					</Link>
				</Text>
			}
		>
			<FormControl isInvalid={!!errors.email} className="gap-2">
				<FormControlLabel>
					<FormControlLabelText className="text-sm ">
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
								placeholderTextColor="#94a3b8"
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
					<FormControlLabelText className="text-sm ">
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
								placeholder="Digite sua senha"
								placeholderTextColor="#94a3b8"
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

			<Controller
				control={control}
				name="remember"
				render={({ field: { value, onChange } }) => (
					<Checkbox isChecked={value} onChange={onChange} value="remember">
						<CheckboxIndicator className="data-[checked=true]:border-primary data-[checked=true]:bg-primary">
							<CheckboxIcon as={Check} />
						</CheckboxIndicator>
						<CheckboxLabel className="text-xs">
							Lembrar de mim por 30 dias
						</CheckboxLabel>
					</Checkbox>
				)}
			/>

			<Button
				size="lg"
				className="mt-1 bg-primary"
				onPress={handleSubmit(onSubmit)}
				isDisabled={isSubmitting}
			>
				<ButtonText>Entrar</ButtonText>
			</Button>

			<Button variant="outline" className="bg-transparent">
				<ButtonIcon as={Chrome} />
				<ButtonText>Entrar com Google</ButtonText>
			</Button>
		</AuthScreenLayout>
	);
}

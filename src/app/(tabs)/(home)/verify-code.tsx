import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { z } from "zod";
import { AuthScreenLayout } from "@/components/auth/auth-screen-layout";
import { Button, ButtonText } from "@/components/ui/button";
import {
	FormControl,
	FormControlError,
	FormControlErrorText,
} from "@/components/ui/form-control";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";

const verifyCodeSchema = z.object({
	code: z
		.string()
		.regex(/^\d{4}$/, "Digite o código de 4 dígitos enviado por e-mail."),
});

type VerifyCodeFormValues = z.infer<typeof verifyCodeSchema>;

export default function VerifyCodeScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{ email?: string }>();

	const {
		control,
		watch,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<VerifyCodeFormValues>({
		resolver: zodResolver(verifyCodeSchema),
		defaultValues: {
			code: "",
		},
	});

	const codeValue = watch("code") ?? "";
	const email =
		typeof params.email === "string" && params.email.length > 0
			? params.email
			: "seu e-mail";

	const onSubmit = () => {
		router.push("/");
	};

	return (
		<AuthScreenLayout
			title="Confirme seu e-mail"
			subtitle={`Enviamos um código para ${email}.`}
			footer={
				<Text className="text-xs">
					<Link href="/sign-in" className="font-semibold">
						Voltar para login
					</Link>
				</Text>
			}
		>
			<FormControl isInvalid={!!errors.code} className="gap-3">
				<Controller
					control={control}
					name="code"
					render={({ field: { onChange, onBlur, value } }) => (
						<Input>
							<InputField
								value={value}
								onBlur={onBlur}
								onChangeText={text => {
									const onlyDigits = text.replace(/\D/g, "").slice(0, 4);
									onChange(onlyDigits);
								}}
								keyboardType="number-pad"
								maxLength={4}
								placeholder="0000"
								className="text-center text-xl tracking-[8px]"
							/>
						</Input>
					)}
				/>

				<View className="flex-row justify-center gap-2">
					{Array.from({ length: 4 }).map((_, index) => {
						const char = codeValue[index] ?? "";
						return (
							<View
								key={`code-box-${index}`}
								className="h-11 w-11 items-center justify-center rounded-md"
							>
								<Text className="text-xl font-semibold">{char}</Text>
							</View>
						);
					})}
				</View>

				{errors.code?.message ? (
					<FormControlError>
						<FormControlErrorText>{errors.code.message}</FormControlErrorText>
					</FormControlError>
				) : null}
			</FormControl>

			<Button
				size="lg"
				className="bg-primary"
				onPress={handleSubmit(onSubmit)}
				isDisabled={isSubmitting}
			>
				<ButtonText>Validar código</ButtonText>
			</Button>

			<Text className="text-center text-xs">
				Não recebeu o e-mail?{" "}
				<Text className="font-semibold">Clique para reenviar</Text>
			</Text>
		</AuthScreenLayout>
	);
}

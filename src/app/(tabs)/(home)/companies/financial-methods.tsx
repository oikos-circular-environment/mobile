import { zodResolver } from "@hookform/resolvers/zod";
import { Stack } from "expo-router";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import {
	type FinancialMethodsFormValues,
	financialMethodsFormSchema,
} from "@/components/companies/financial-methods/financial-methods-form-schema";
import { PaymentsTab } from "@/components/companies/financial-methods/payments-tab";
import { ReceiptsTab } from "@/components/companies/financial-methods/receipts-tab";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Heading } from "@/components/ui/heading";
import {
	companyFinancial,
	type FinancialType,
} from "@/libs/types/financial-method";

const tabLabels: Record<FinancialType, string> = {
	PAYMENT: "Pagamentos",
	RECEIPT: "Recebimentos",
};

export default function CompanyFinancialMethodsScreen() {
	const [activeTab, setActiveTab] = useState<FinancialType>("PAYMENT");

	const form = useForm<FinancialMethodsFormValues>({
		resolver: zodResolver(financialMethodsFormSchema),
		defaultValues: {
			methods:
				companyFinancial as unknown as FinancialMethodsFormValues["methods"],
		},
		mode: "onChange",
	});

	const fieldArray = useFieldArray({
		control: form.control,
		name: "methods",
	});

	const onSubmit = (data: FinancialMethodsFormValues) => {
		console.log("Financial methods data:", data);
		// TODO: Send to API
	};

	return (
		<>
			<Stack.Screen options={{ title: "Métodos Financeiros" }} />
			<KeyboardAvoidingView
				className="flex-1"
				behavior={Platform.OS === "ios" ? "padding" : "height"}
			>
				<ScrollView
					className="flex-1 bg-white"
					contentContainerClassName="p-4 pb-8"
				>
					<View className="gap-4">
						<Heading size="xl">Métodos Financeiros</Heading>

						<View className="flex-row items-center rounded-md border border-border p-1">
							<Button
								variant={activeTab === "PAYMENT" ? "secondary" : "ghost"}
								className="flex-1"
								onPress={() => setActiveTab("PAYMENT")}
							>
								<ButtonText>{tabLabels.PAYMENT}</ButtonText>
							</Button>
							<Button
								variant={activeTab === "RECEIPT" ? "secondary" : "ghost"}
								className="flex-1"
								onPress={() => setActiveTab("RECEIPT")}
							>
								<ButtonText>{tabLabels.RECEIPT}</ButtonText>
							</Button>
						</View>

						{activeTab === "PAYMENT" ? (
							<PaymentsTab form={form} fieldArray={fieldArray} />
						) : (
							<ReceiptsTab form={form} fieldArray={fieldArray} />
						)}

						<View className="flex-row gap-2 mt-4">
							<Button
								variant="outline"
								className="flex-1"
								onPress={() => form.reset()}
								isDisabled={!form.formState.isDirty}
							>
								<ButtonText>Cancelar</ButtonText>
							</Button>
							<Button
								className="flex-1"
								onPress={form.handleSubmit(onSubmit)}
								isDisabled={!form.formState.isDirty || !form.formState.isValid}
							>
								<ButtonText>Salvar</ButtonText>
								{form.formState.isSubmitting && <ButtonIcon as={Spinner} />}
							</Button>
						</View>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</>
	);
}

import { AlertCircle, Check } from "lucide-react-native";
import { useMemo } from "react";
import {
	Controller,
	type UseFieldArrayReturn,
	type UseFormReturn,
} from "react-hook-form";
import { View } from "react-native";
import { Card } from "@/components/ui/card";
import {
	Checkbox,
	CheckboxIcon,
	CheckboxIndicator,
	CheckboxLabel,
} from "@/components/ui/checkbox";
import {
	FormControl,
	FormControlError,
	FormControlErrorIcon,
	FormControlErrorText,
} from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { Input, InputField } from "@/components/ui/input";
import { colors } from "@/components/style/colors";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/components/ui/text";
import {
	financialFlagsOptions,
	financialMeansOptions,
} from "@/libs/types/financial-method";
import type { FinancialMethodsFormValues } from "./financial-methods-form-schema";
import { FlagCard } from "./flag-card";

interface PaymentsTabProps {
	form: UseFormReturn<FinancialMethodsFormValues>;
	fieldArray: UseFieldArrayReturn<FinancialMethodsFormValues, "methods">;
}

const flagsOptionsWithoutAll = financialFlagsOptions.filter(
	option => option.value !== "ALL",
);

const tabDescription =
	"Pagamentos: como sua empresa paga clientes, parceiros ou fornecedores.";

export function PaymentsTab({ form, fieldArray }: PaymentsTabProps) {
	const { control, formState } = form;
	const { fields } = fieldArray;

	const paymentMethods = useMemo(
		() => fields.filter(field => field.type === "PAYMENT"),
		[fields],
	);

	const meansLabelByValue = useMemo(
		() =>
			Object.fromEntries(
				financialMeansOptions.map(option => [option.value, option.label]),
			),
		[],
	);

	return (
		<View className="gap-4">
			<Card className="shadow-none gap-2">
				<Heading size="sm">Sobre esta seção</Heading>
				<Text className="text-muted-foreground">{tabDescription}</Text>
				<Text className="text-muted-foreground">
					Os campos já vêm pré-definidos. Você pode ativar ou ajustar cada
					característica conforme a política financeira da empresa.
				</Text>
			</Card>

			{paymentMethods.map(entry => {
				const globalIndex = fields.findIndex(f => f.id === entry.id);

				return (
					<Card key={entry.id} className="shadow-none gap-3">
						<View className="flex-row items-center justify-between">
							<View className="flex-1 pr-3">
								<Heading size="lg">
									{meansLabelByValue[entry.financial_means]}
								</Heading>
							</View>
							<View className="items-end gap-1">
								<Controller
									control={control}
									name={`methods.${globalIndex}.active`}
									render={({ field: { value, onChange } }) => (
										<Switch
											value={value}
											onValueChange={onChange}
											trackColor={{ false: colors.gray[300], true: colors.lime[500] }}
										/>
									)}
								/>
							</View>
						</View>

						{entry.financial_means === "CREDIT_CARD" ||
						entry.financial_means === "DEBIT_CARD" ? (
							<View className="gap-2">
								<Text className="text-sm">Bandeiras aceitas</Text>
								<Controller
									control={control}
									name={`methods.${globalIndex}.flags`}
									render={({ field: { value, onChange } }) => (
										<View className="gap-2">
											<Checkbox
												value="ALL"
												isChecked={
													!!value &&
													flagsOptionsWithoutAll.every(option =>
														(value as string[]).includes(option.value),
													)
												}
												onChange={checked => {
													if (checked) {
														onChange(
															flagsOptionsWithoutAll.map(opt => opt.value),
														);
													} else {
														onChange(null);
													}
												}}
											>
												<CheckboxIndicator>
													<CheckboxIcon as={Check} />
												</CheckboxIndicator>
												<CheckboxLabel>Todas as bandeiras</CheckboxLabel>
											</Checkbox>

											<View className="gap-2">
												{flagsOptionsWithoutAll.map(flagOption => {
													const isChecked =
														(value as string[] | null)?.includes(
															flagOption.value,
														) ?? false;

													return (
														<FlagCard
															key={flagOption.value}
															label={flagOption.label}
															isChecked={isChecked}
															onChange={checked => {
																const nextFlags = new Set(value ?? []);
																if (checked) {
																	nextFlags.add(
																		flagOption.value as
																			| "VISA"
																			| "MASTERCARD"
																			| "AMEX"
																			| "ELO"
																			| "HIPERCARD"
																			| "OUTRO",
																	);
																} else {
																	nextFlags.delete(
																		flagOption.value as
																			| "VISA"
																			| "MASTERCARD"
																			| "AMEX"
																			| "ELO"
																			| "HIPERCARD"
																			| "OUTRO",
																	);
																}
																onChange(
																	nextFlags.size > 0
																		? Array.from(nextFlags)
																		: null,
																);
															}}
														/>
													);
												})}
											</View>
										</View>
									)}
								/>
							</View>
						) : null}

						<FormControl
							isInvalid={
								!!formState.errors.methods?.[globalIndex]?.observations
							}
						>
							<Text className="text-sm">Observações</Text>
							<Input>
								<Controller
									control={control}
									name={`methods.${globalIndex}.observations`}
									render={({ field: { value, onChange } }) => (
										<InputField
											value={value ?? ""}
											onChangeText={onChange}
											placeholder="Adicione observações (opcional)"
										/>
									)}
								/>
							</Input>
							{formState.errors.methods?.[globalIndex]?.observations && (
								<FormControlError>
									<FormControlErrorIcon as={AlertCircle} />
									<FormControlErrorText>
										{
											formState.errors.methods[globalIndex]?.observations
												?.message
										}
									</FormControlErrorText>
								</FormControlError>
							)}
						</FormControl>
					</Card>
				);
			})}
		</View>
	);
}

import { AlertCircleIcon, SearchIcon } from "lucide-react-native";
import type { Control, FieldErrors, FieldValues, Path } from "react-hook-form";
import { Controller } from "react-hook-form";
import { View } from "react-native";
import {
	FormControl,
	FormControlError,
	FormControlErrorIcon,
	FormControlErrorText,
	FormControlLabel,
	FormControlLabelText,
} from "@/components/ui/form-control";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { mask } from "@/libs/mask";

export type AddressFormValues = FieldValues & {
	postalCode: string;
	street: string;
	streetNumber: string;
	district: string;
	region: string;
	city: string;
};

export type AddressFormFieldsProps<T extends AddressFormValues> = {
	control: Control<T>;
	errors: FieldErrors<T>;
	handleCepLookup: (value: string) => Promise<void>;
	isLookingUpCep: boolean;
};

export function AddressFormFields<T extends AddressFormValues>({
	control,
	errors,
	handleCepLookup,
	isLookingUpCep,
}: AddressFormFieldsProps<T>) {
	return (
		<>
			<FormControl isInvalid={!!errors.postalCode} className="gap-1">
				<FormControlLabel>
					<FormControlLabelText>CEP *</FormControlLabelText>
				</FormControlLabel>
				<Controller
					control={control}
					name={"postalCode" as Path<T>}
					render={({ field: { value, onChange, onBlur } }) => (
						<Input>
							<InputField
								placeholder="00000-000"
								keyboardType="default"
								autoCorrect={false}
								autoCapitalize="none"
								spellCheck={false}
								value={value}
								onChangeText={v => onChange(mask.cep(v))}
								onBlur={() => {
									onBlur();
									void handleCepLookup(value);
								}}
								maxLength={9}
								returnKeyType="done"
							/>

							<InputSlot
								className="pr-3"
								testID="cep-search-btn"
								onPress={() => void handleCepLookup(value)}
							>
								<InputIcon as={isLookingUpCep ? Spinner : SearchIcon} />
							</InputSlot>
						</Input>
					)}
				/>
				{errors.postalCode?.message && (
					<FormControlError>
						<FormControlErrorIcon as={AlertCircleIcon} />
						<FormControlErrorText>
							{String(errors.postalCode.message)}
						</FormControlErrorText>
					</FormControlError>
				)}
			</FormControl>

			<View className="flex-row gap-3">
				<FormControl isInvalid={!!errors.street} className="flex-1 gap-1">
					<FormControlLabel>
						<FormControlLabelText>Rua *</FormControlLabelText>
					</FormControlLabel>
					<Controller
						control={control}
						name={"street" as Path<T>}
						render={({ field: { value, onChange } }) => (
							<Input>
								<InputField
									placeholder="Nome da rua"
									value={value}
									onChangeText={onChange}
								/>
							</Input>
						)}
					/>
					{errors.street?.message && (
						<FormControlError>
							<FormControlErrorIcon as={AlertCircleIcon} />
							<FormControlErrorText>
								{String(errors.street.message)}
							</FormControlErrorText>
						</FormControlError>
					)}
				</FormControl>

				<FormControl isInvalid={!!errors.streetNumber} className="w-24 gap-1">
					<FormControlLabel>
						<FormControlLabelText>Nº *</FormControlLabelText>
					</FormControlLabel>
					<Controller
						control={control}
						name={"streetNumber" as Path<T>}
						render={({ field: { value, onChange } }) => (
							<Input>
								<InputField
									placeholder="123"
									keyboardType="numeric"
									value={value}
									onChangeText={onChange}
								/>
							</Input>
						)}
					/>
					{errors.streetNumber?.message && (
						<FormControlError>
							<FormControlErrorIcon as={AlertCircleIcon} />
							<FormControlErrorText>
								{String(errors.streetNumber.message)}
							</FormControlErrorText>
						</FormControlError>
					)}
				</FormControl>
			</View>

			<View className="flex-row gap-3">
				<FormControl isInvalid={!!errors.district} className="flex-1 gap-1">
					<FormControlLabel>
						<FormControlLabelText>Bairro *</FormControlLabelText>
					</FormControlLabel>
					<Controller
						control={control}
						name={"district" as Path<T>}
						render={({ field: { value, onChange } }) => (
							<Input>
								<InputField
									placeholder="Bairro"
									value={value}
									onChangeText={onChange}
								/>
							</Input>
						)}
					/>
					{errors.district?.message && (
						<FormControlError>
							<FormControlErrorIcon as={AlertCircleIcon} />
							<FormControlErrorText>
								{String(errors.district.message)}
							</FormControlErrorText>
						</FormControlError>
					)}
				</FormControl>

				<FormControl isInvalid={!!errors.region} className="w-24 gap-1">
					<FormControlLabel>
						<FormControlLabelText>UF *</FormControlLabelText>
					</FormControlLabel>
					<Controller
						control={control}
						name={"region" as Path<T>}
						render={({ field: { value, onChange } }) => (
							<Input>
								<InputField
									placeholder="SP"
									value={value}
									onChangeText={v =>
										onChange(
											v
												.toUpperCase()
												.replace(/[^A-Z]/g, "")
												.slice(0, 2),
										)
									}
									maxLength={2}
									autoCapitalize="characters"
								/>
							</Input>
						)}
					/>
					{errors.region?.message && (
						<FormControlError>
							<FormControlErrorIcon as={AlertCircleIcon} />
							<FormControlErrorText>
								{String(errors.region.message)}
							</FormControlErrorText>
						</FormControlError>
					)}
				</FormControl>
			</View>

			<FormControl isInvalid={!!errors.city} className="gap-1">
				<FormControlLabel>
					<FormControlLabelText>Cidade *</FormControlLabelText>
				</FormControlLabel>
				<Controller
					control={control}
					name={"city" as Path<T>}
					render={({ field: { value, onChange } }) => (
						<Input>
							<InputField
								placeholder="Cidade"
								value={value}
								onChangeText={onChange}
							/>
						</Input>
					)}
				/>
				{errors.city?.message && (
					<FormControlError>
						<FormControlErrorIcon as={AlertCircleIcon} />
						<FormControlErrorText>
							{String(errors.city.message)}
						</FormControlErrorText>
					</FormControlError>
				)}
			</FormControl>
		</>
	);
}

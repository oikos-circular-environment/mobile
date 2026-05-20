import React, { createContext, useContext } from "react";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { moneyUtils } from "@/libs/money";

// 1. Contexto para compartilhar o modo (price | decimal) entre os sub-componentes
type DecimalInputContextType = {
	mode: "price" | "decimal";
};

const DecimalInputContext = createContext<DecimalInputContextType | undefined>(
	undefined,
);

function useDecimalInputContext() {
	const context = useContext(DecimalInputContext);
	if (!context) {
		throw new Error(
			"DecimalInput sub-components must be rendered within a DecimalInput",
		);
	}
	return context;
}

// 2. Componente Root (DecimalInput)
type IDecimalInputProps = React.ComponentProps<typeof Input> & {
	mode?: "price" | "decimal";
};

const DecimalInput = React.forwardRef<
	React.ComponentRef<typeof Input>,
	IDecimalInputProps
>(({ children, mode = "price", ...props }, ref) => {
	return (
		<DecimalInputContext.Provider value={{ mode }}>
			<Input ref={ref} {...props}>
				{children}
			</Input>
		</DecimalInputContext.Provider>
	);
});

// 3. Componente de Campo (DecimalInputField)
type IDecimalInputFieldProps = Omit<
	React.ComponentProps<typeof InputField>,
	"onChangeText"
> & {
	onChangeText?: (text: string) => void;
};

const DecimalInputField = React.forwardRef<
	React.ComponentRef<typeof InputField>,
	IDecimalInputFieldProps
>(({ value, onChangeText, ...props }, ref) => {
	const { mode } = useDecimalInputContext();

	// Converte o valor (number do banco ou string formatada) para o formato visual
	const minorUnits = moneyUtils.parse(value?.toString() || "0");
	const dineroObj = moneyUtils.create(minorUnits);
	const displayValue = moneyUtils.format(dineroObj, mode === "price");

	const handleChangeText = (text: string) => {
		if (!onChangeText) return;

		const digits = text.replace(/\D/g, "");
		// Cria um novo objeto Dinero com os dígitos brutos
		const newDinero = moneyUtils.create(Number(digits) || 0);
		// Emite a versão formatada para o formulário (RHF)
		onChangeText(moneyUtils.format(newDinero, mode === "price"));
	};

	return (
		<InputField
			ref={ref}
			{...props}
			value={displayValue}
			onChangeText={handleChangeText}
			keyboardType="numeric"
		/>
	);
});

// 4. Componentes de UI (Repasse para o Gluestack)
const DecimalInputIcon = InputIcon;
const DecimalInputSlot = InputSlot;

DecimalInput.displayName = "DecimalInput";
DecimalInputField.displayName = "DecimalInputField";
DecimalInputIcon.displayName = "DecimalInputIcon";
DecimalInputSlot.displayName = "DecimalInputSlot";

export {
	DecimalInput,
	DecimalInputField,
	DecimalInputIcon,
	DecimalInputSlot,
};

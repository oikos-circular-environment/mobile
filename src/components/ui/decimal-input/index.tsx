import type { LucideIcon } from "lucide-react-native";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { mask } from "@/libs/mask";

type DecimalInputProps = {
	value: string;
	onChange: (s: string) => void;
	onBlur?: () => void;
	mode?: "price" | "decimal";
	icon?: LucideIcon;
	placeholder?: string;
	className?: string;
};

export function DecimalInput({
	value,
	onChange,
	onBlur,
	mode = "price",
	icon,
	placeholder,
	className,
}: DecimalInputProps) {
	const maskFn = mode === "price" ? mask.price : mask.decimal;
	return (
		<Input className={className}>
			{icon ? (
				<InputSlot className="bg-accent p-1 rounded-md">
					<InputIcon as={icon} />
				</InputSlot>
			) : null}
			<InputField
				value={value}
				onBlur={onBlur}
				onChangeText={text => onChange(maskFn(text))}
				placeholder={placeholder}
				placeholderTextColor="#94a3b8"
				keyboardType="numbers-and-punctuation"
			/>
		</Input>
	);
}

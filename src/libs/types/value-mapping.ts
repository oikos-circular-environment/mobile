import type { LucideIcon } from "lucide-react-native";

export interface ValueMapping<T> {
	value: T;
	label: string;
	description?: string;
	icon?: LucideIcon;
}

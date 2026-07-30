import { ChevronDownIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { useState } from "react";
import { View } from "react-native";
import { colors } from "@/components/style/colors";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { cn } from "@/libs/utils";

interface InfoExpandProps {
	label: string;
	children: ReactNode;
	defaultOpen?: boolean;
	className?: string;
}

export function InfoExpand({
	label,
	children,
	defaultOpen = false,
	className,
}: InfoExpandProps) {
	const [open, setOpen] = useState(defaultOpen);

	return (
		<View
			className={cn("rounded-lg border border-lime-200 bg-lime-50", className)}
		>
			<Pressable
				onPress={() => setOpen(current => !current)}
				className="flex-row items-center justify-between p-3"
			>
				<Text size="sm" bold className="flex-1 text-lime-700">
					{label}
				</Text>
				<View className={cn(open && "rotate-180")}>
					<ChevronDownIcon size={16} color={colors.lime[700]} />
				</View>
			</Pressable>

			{open ? <View className="gap-2 px-3 pb-3">{children}</View> : null}
		</View>
	);
}

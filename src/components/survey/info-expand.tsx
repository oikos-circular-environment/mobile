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
		<View className={className}>
			<Pressable
				onPress={() => setOpen(current => !current)}
				className="flex-row items-center justify-between py-2"
			>
				<Text size="sm" bold className="flex-1">
					{label}
				</Text>
				<View className={cn(open && "rotate-180")}>
					<ChevronDownIcon size={16} color={colors.gray[400]} />
				</View>
			</Pressable>

			{open ? <View className="pb-2">{children}</View> : null}
		</View>
	);
}

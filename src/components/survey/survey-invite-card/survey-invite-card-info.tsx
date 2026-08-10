import { Children } from "react";
import { View } from "react-native";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { cn } from "@/libs/utils";

interface SurveyInviteCardInfoProps {
	children: React.ReactNode;
	className?: string;
}

export function SurveyInviteCardInfo({
	children,
	className,
}: SurveyInviteCardInfoProps) {
	const items = Children.toArray(children).filter(Boolean);
	if (items.length === 0) return null;

	return <View className={cn("flex-row gap-2.5", className)}>{items}</View>;
}

interface SurveyInviteCardInfoItemProps {
	children: React.ReactNode;
	onPress?: () => void;
	className?: string;
}

export function SurveyInviteCardInfoItem({
	children,
	onPress,
	className,
}: SurveyInviteCardInfoItemProps) {
	const content = (
		<View
			className={cn(
				"flex-1 flex-row items-center justify-between gap-2 rounded-lg bg-white/10 p-3",
				className,
			)}
		>
			{children}
		</View>
	);

	if (onPress) {
		return (
			<Pressable onPress={onPress} className="flex-1">
				{content}
			</Pressable>
		);
	}

	return content;
}

interface SurveyInviteCardInfoItemContentProps {
	children: React.ReactNode;
	className?: string;
}

export function SurveyInviteCardInfoItemContent({
	children,
	className,
}: SurveyInviteCardInfoItemContentProps) {
	return <View className={cn("flex-1 gap-0.5", className)}>{children}</View>;
}

interface SurveyInviteCardInfoItemLabelProps {
	children: React.ReactNode;
	className?: string;
}

export function SurveyInviteCardInfoItemLabel({
	children,
	className,
}: SurveyInviteCardInfoItemLabelProps) {
	return (
		<Text
			size="xs"
			bold
			className={cn("uppercase tracking-wider text-white/70", className)}
		>
			{children}
		</Text>
	);
}

interface SurveyInviteCardInfoItemValueProps {
	children: React.ReactNode;
	className?: string;
}

export function SurveyInviteCardInfoItemValue({
	children,
	className,
}: SurveyInviteCardInfoItemValueProps) {
	return (
		<Text
			size="xs"
			bold
			className={cn("text-white", className)}
			numberOfLines={1}
		>
			{children}
		</Text>
	);
}

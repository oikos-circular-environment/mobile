import {
	useStyleContext,
	withStyleContext,
} from "@gluestack-ui/utils/nativewind-utils";
import { RadarIcon } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { cn } from "@/libs/utils";

const SCOPE = "COMPLAINT_RADIUS_FILTER";
const ContextView = withStyleContext(View, SCOPE);

// ─── Root ─────────────────────────────────────────────────────────────────────

type IComplaintRadiusFilterProps = Omit<
	React.ComponentPropsWithoutRef<typeof Pressable>,
	"children"
> & {
	label: string;
	selected?: boolean;
	className?: string;
	children?: React.ReactNode;
};

export function ComplaintRadiusFilter({
	label,
	selected = false,
	children,
	className,
	onPress,
	...props
}: IComplaintRadiusFilterProps) {
	return (
		<Pressable onPress={onPress} {...props}>
			<ContextView
				className={cn(
					"flex-row items-center gap-1 border rounded-lg px-4 py-2",
					selected ? "bg-lime-800 border-lime-800" : "bg-white border-border",
					className,
				)}
				context={{ label, selected }}
			>
				{children ?? (
					<>
						<ComplaintRadiusFilterIcon />
						<ComplaintRadiusFilterText />
					</>
				)}
			</ContextView>
		</Pressable>
	);
}

// ─── Icon ─────────────────────────────────────────────────────────────────────

type IComplaintRadiusFilterIconProps = { size?: number };

export const ComplaintRadiusFilterIcon = React.forwardRef<
	View,
	IComplaintRadiusFilterIconProps
>(function ComplaintRadiusFilterIcon({ size = 12 }, _ref) {
	const { selected: parentSelected } = useStyleContext(SCOPE);
	return (
		<RadarIcon
			size={size}
			color={parentSelected ? "#ffffff" : "#9ca3af"}
			strokeWidth={2.5}
		/>
	);
});

// ─── Text ─────────────────────────────────────────────────────────────────────

type IComplaintRadiusFilterTextProps = React.ComponentPropsWithoutRef<
	typeof Text
>;

export const ComplaintRadiusFilterText = React.forwardRef<
	React.ComponentRef<typeof Text>,
	IComplaintRadiusFilterTextProps
>(function ComplaintRadiusFilterText({ children, className, ...props }, ref) {
	const { label: parentLabel, selected: parentSelected } =
		useStyleContext(SCOPE);
	const colorClass = parentSelected ? "text-white" : "text-gray-400";
	return (
		<Text
			ref={ref}
			className={cn("text-xs font-semibold", colorClass, className)}
			{...props}
		>
			{children ?? parentLabel}
		</Text>
	);
});

ComplaintRadiusFilter.displayName = "ComplaintRadiusFilter";
ComplaintRadiusFilterIcon.displayName = "ComplaintRadiusFilterIcon";
ComplaintRadiusFilterText.displayName = "ComplaintRadiusFilterText";

export type { IComplaintRadiusFilterProps as ComplaintRadiusFilterProps };

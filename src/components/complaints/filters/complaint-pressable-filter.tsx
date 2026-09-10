import { UIIcon } from "@gluestack-ui/core/icon/creator";
import {
	tva,
	useStyleContext,
	type VariantProps,
	withStyleContext,
} from "@gluestack-ui/utils/nativewind-utils";
import { styled } from "nativewind";
import React from "react";
import { Pressable, Text, View } from "react-native";
import type { Svg } from "react-native-svg";
import { cn } from "@/libs/utils";

const SCOPE = "COMPLAINT_PRESSABLE_FILTER";

// ─── StyledIcon ───────────────────────────────────────────────────────────────

const StyledUIIcon = styled(UIIcon, {
	className: {
		target: "style",
		nativeStyleToProp: {
			height: true,
			width: true,
			fill: true,
			color: "classNameColor",
			stroke: true,
		} as never,
	},
});

// ─── TVA styles ───────────────────────────────────────────────────────────────

const complaintPressableFilterStyle = tva({
	base: "flex-row items-center gap-1 border rounded-lg px-4 py-2",
	variants: {
		selected: {
			true: "bg-primary border-primary",
			false: "bg-background border-border",
		},
	},
});

const complaintPressableFilterIconStyle = tva({
	base: "fill-none h-3 w-3 pointer-events-none",
	parentVariants: {
		selected: {
			true: "text-primary-foreground",
			false: "text-muted-foreground",
		},
	},
});

const complaintPressableFilterTextStyle = tva({
	base: "text-xs font-semibold",
	parentVariants: {
		selected: {
			true: "text-primary-foreground",
			false: "text-muted-foreground",
		},
	},
});

// ─── Context ──────────────────────────────────────────────────────────────────

const ContextView = withStyleContext(View, SCOPE);

// ─── Root ─────────────────────────────────────────────────────────────────────

type IComplaintPressableFilterProps = Omit<
	React.ComponentPropsWithoutRef<typeof Pressable>,
	"children"
> &
	VariantProps<typeof complaintPressableFilterStyle> & {
		selected?: boolean;
		className?: string;
		children?: React.ReactNode;
	};

export function ComplaintPressableFilter({
	selected = false,
	children,
	className,
	onPress,
	...props
}: IComplaintPressableFilterProps) {
	return (
		<Pressable onPress={onPress} {...props}>
			<ContextView
				className={complaintPressableFilterStyle({
					selected,
					class: className,
				})}
				context={{ selected }}
			>
				{children}
			</ContextView>
		</Pressable>
	);
}

// ─── Icon ─────────────────────────────────────────────────────────────────────

type IComplaintPressableFilterIconProps = {
	as: React.ComponentType<object>;
	size?: number;
	className?: string;
};

export const ComplaintPressableFilterIcon = React.forwardRef<
	React.ComponentRef<typeof Svg>,
	IComplaintPressableFilterIconProps
>(function ComplaintPressableFilterIcon(
	{ as: IconComponent, size, className },
	_ref,
) {
	const { selected: parentSelected } = useStyleContext(SCOPE);

	if (typeof size === "number") {
		return (
			<StyledUIIcon
				as={IconComponent}
				size={size}
				className={cn(
					complaintPressableFilterIconStyle({
						parentVariants: { selected: parentSelected },
					}),
					className,
				)}
			/>
		);
	}

	return (
		<StyledUIIcon
			as={IconComponent}
			className={cn(
				complaintPressableFilterIconStyle({
					parentVariants: { selected: parentSelected },
				}),
				className,
			)}
		/>
	);
});

// ─── Text ─────────────────────────────────────────────────────────────────────

type IComplaintPressableFilterTextProps = React.ComponentPropsWithoutRef<
	typeof Text
>;

export const ComplaintPressableFilterText = React.forwardRef<
	React.ComponentRef<typeof Text>,
	IComplaintPressableFilterTextProps
>(function ComplaintPressableFilterText(
	{ children, className, ...props },
	ref,
) {
	const { selected: parentSelected } = useStyleContext(SCOPE);
	return (
		<Text
			ref={ref}
			className={complaintPressableFilterTextStyle({
				parentVariants: { selected: parentSelected },
				class: className,
			})}
			{...props}
		>
			{children}
		</Text>
	);
});

ComplaintPressableFilter.displayName = "ComplaintPressableFilter";
ComplaintPressableFilterIcon.displayName = "ComplaintPressableFilterIcon";
ComplaintPressableFilterText.displayName = "ComplaintPressableFilterText";

export type {
	IComplaintPressableFilterIconProps as ComplaintPressableFilterIconProps,
	IComplaintPressableFilterProps as ComplaintPressableFilterProps,
	IComplaintPressableFilterTextProps as ComplaintPressableFilterTextProps,
};

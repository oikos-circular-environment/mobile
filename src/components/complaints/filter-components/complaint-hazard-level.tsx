"use client";
import { type PrimitiveIcon, UIIcon } from "@gluestack-ui/core/icon/creator";
import {
	useStyleContext,
	withStyleContext,
} from "@gluestack-ui/utils/nativewind-utils";
import {
	ChevronDownIcon,
	ChevronsUpIcon,
	ChevronUpIcon,
	MinusIcon,
} from "lucide-react-native";
import { styled } from "nativewind";
import React from "react";
import { Pressable, Text, View } from "react-native";
import type { Svg } from "react-native-svg";
import type { HazardLevelVariant } from "@/components/custom/waste-category";
import { cn } from "@/libs/utils";

export type HazardLevelButtonFilterVariant = HazardLevelVariant | "all";

const SCOPE = "WASTE_CATEGORY_HAZARD_LEVEL_BUTTON_FILTER";

const DEFAULT_ICONS: Record<HazardLevelVariant, React.ComponentType<object>> = {
	low: ChevronDownIcon,
	medium: MinusIcon,
	high: ChevronUpIcon,
	very_high: ChevronsUpIcon,
};

const LABELS: Record<HazardLevelButtonFilterVariant, string> = {
	all: "Todos",
	low: "Baixa",
	medium: "Média",
	high: "Alta",
	very_high: "Muito alta",
};

const SELECTED_CONTAINER: Record<HazardLevelButtonFilterVariant, string> = {
	all: "bg-lime-800 border-lime-800",
	low: "bg-lime-100 border-lime-400",
	medium: "bg-yellow-100 border-yellow-400",
	high: "bg-orange-100 border-orange-400",
	very_high: "bg-red-100 border-red-400",
};

const SELECTED_ICON_CLASS: Record<HazardLevelVariant, string> = {
	low: "text-lime-600",
	medium: "text-yellow-600",
	high: "text-orange-600",
	very_high: "text-red-600",
};

const SELECTED_TEXT_CLASS: Record<HazardLevelButtonFilterVariant, string> = {
	all: "text-white",
	low: "text-lime-600",
	medium: "text-yellow-600",
	high: "text-orange-600",
	very_high: "text-red-600",
};

const ContextView = withStyleContext(View, SCOPE);

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

// ─── Root ─────────────────────────────────────────────────────────────────────

type IComplaintHazardLevelFilterProps = Omit<
	React.ComponentPropsWithoutRef<typeof Pressable>,
	"children"
> & {
	variant: HazardLevelButtonFilterVariant;
	selected?: boolean;
	className?: string;
	children?: React.ReactNode;
};

export function ComplaintHazardLevelFilter({
	variant,
	selected = false,
	children,
	className,
	onPress,
	...props
}: IComplaintHazardLevelFilterProps) {
	return (
		<Pressable onPress={onPress} {...props}>
			<ContextView
				className={cn(
					"flex-row items-center gap-1 border rounded-lg px-4 py-2",
					selected ? SELECTED_CONTAINER[variant] : "bg-white border-border",
					className,
				)}
				context={{ variant, selected }}
			>
				{children ??
					(variant === "all" ? (
						<ComplaintHazardLevelFilterText />
					) : (
						<>
							<ComplaintHazardLevelFilterIcon />
							<ComplaintHazardLevelFilterText />
						</>
					))}
			</ContextView>
		</Pressable>
	);
}

// ─── Icon ─────────────────────────────────────────────────────────────────────

type IComplaintHazardLevelFilterIconProps = React.ComponentPropsWithoutRef<
	typeof PrimitiveIcon
> & {
	size?: number;
	className?: string;
};

export const ComplaintHazardLevelFilterIcon = React.forwardRef<
	React.ComponentRef<typeof Svg>,
	IComplaintHazardLevelFilterIconProps
>(function ComplaintHazardLevelFilterIcon(
	{ as, size, className, ...props },
	ref,
) {
	const { variant: parentVariant, selected: parentSelected } =
		useStyleContext(SCOPE);
	const IconComponent =
		as ?? DEFAULT_ICONS[parentVariant as HazardLevelVariant];
	const colorClass = parentSelected
		? SELECTED_ICON_CLASS[parentVariant as HazardLevelVariant]
		: "text-gray-400";

	if (typeof size === "number") {
		return (
			<StyledUIIcon
				ref={ref}
				as={IconComponent}
				size={size}
				className={cn(
					"fill-none pointer-events-none stroke-3",
					colorClass,
					className,
				)}
				{...props}
			/>
		);
	}

	return (
		<StyledUIIcon
			ref={ref}
			as={IconComponent}
			className={cn(
				"fill-none h-3 w-3 pointer-events-none stroke-3",
				colorClass,
				className,
			)}
			{...props}
		/>
	);
});

// ─── Text ─────────────────────────────────────────────────────────────────────

type IComplaintHazardLevelFilterTextProps = React.ComponentPropsWithoutRef<
	typeof Text
>;

export const ComplaintHazardLevelFilterText = React.forwardRef<
	React.ComponentRef<typeof Text>,
	IComplaintHazardLevelFilterTextProps
>(function ComplaintHazardLevelFilterText(
	{ children, className, ...props },
	ref,
) {
	const { variant: parentVariant, selected: parentSelected } =
		useStyleContext(SCOPE);
	const colorClass = parentSelected
		? SELECTED_TEXT_CLASS[parentVariant as HazardLevelButtonFilterVariant]
		: "text-gray-400";

	return (
		<Text
			ref={ref}
			className={cn("text-xs font-semibold", colorClass, className)}
			{...props}
		>
			{children ?? LABELS[parentVariant as HazardLevelButtonFilterVariant]}
		</Text>
	);
});

ComplaintHazardLevelFilter.displayName = "ComplaintHazardLevelFilter";
ComplaintHazardLevelFilterIcon.displayName = "ComplaintHazardLevelFilterIcon";
ComplaintHazardLevelFilterText.displayName = "ComplaintHazardLevelFilterText";

export type {
	IComplaintHazardLevelFilterProps as ComplaintHazardLevelFilterProps,
};

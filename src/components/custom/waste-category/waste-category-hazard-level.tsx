"use client";
import { type PrimitiveIcon, UIIcon } from "@gluestack-ui/core/icon/creator";
import type { VariantProps } from "@gluestack-ui/utils/nativewind-utils";
import {
	tva,
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
import { Text, View } from "react-native";
import type { Svg } from "react-native-svg";

export type HazardLevelVariant = "low" | "medium" | "high" | "very_high";

const SCOPE = "WASTE_CATEGORY_HAZARD_LEVEL";

const hazardLevelStyle = tva({
	base: "gap-1 border flex-row items-center rounded-full px-2.5 py-0.5",
	variants: {
		variant: {
			low: "bg-lime-50 border-lime-200",
			medium: "bg-yellow-50 border-yellow-200",
			high: "bg-orange-50 border-orange-200",
			very_high: "bg-red-50 border-red-200",
		},
	},
});

const hazardLevelIconStyle = tva({
	base: "fill-none h-3 w-3 pointer-events-none stroke-3",
	parentVariants: {
		variant: {
			low: "text-lime-600",
			medium: "text-yellow-600",
			high: "text-orange-600",
			very_high: "text-red-600",
		},
	},
});

const hazardLevelTextStyle = tva({
	base: "text-xs font-semibold",
	parentVariants: {
		variant: {
			low: "text-lime-600",
			medium: "text-yellow-600",
			high: "text-orange-600",
			very_high: "text-red-600",
		},
	},
});

const DEFAULT_ICONS: Record<HazardLevelVariant, React.ComponentType<object>> = {
	low: ChevronDownIcon,
	medium: MinusIcon,
	high: ChevronUpIcon,
	very_high: ChevronsUpIcon,
};

const LABELS: Record<HazardLevelVariant, string> = {
	low: "Baixa",
	medium: "Média",
	high: "Alta",
	very_high: "Muito alta",
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
		},
	},
});

// ─── Root ─────────────────────────────────────────────────────────────────────

type IWasteCategoryHazardLevelProps =
	React.ComponentPropsWithoutRef<typeof ContextView> &
		VariantProps<typeof hazardLevelStyle>;

export function WasteCategoryHazardLevel({
	variant,
	children,
	className,
	...props
}: IWasteCategoryHazardLevelProps) {
	return (
		<ContextView
			className={hazardLevelStyle({ variant, class: className })}
			{...props}
			context={{ variant }}
		>
			{children ?? (
				<>
					<WasteCategoryHazardLevelIcon />
					<WasteCategoryHazardLevelText />
				</>
			)}
		</ContextView>
	);
}

// ─── Icon ─────────────────────────────────────────────────────────────────────

type IWasteCategoryHazardLevelIconProps =
	React.ComponentPropsWithoutRef<typeof PrimitiveIcon> &
		VariantProps<typeof hazardLevelIconStyle> & {
			size?: number;
		};

export const WasteCategoryHazardLevelIcon = React.forwardRef<
	React.ComponentRef<typeof Svg>,
	IWasteCategoryHazardLevelIconProps
>(function WasteCategoryHazardLevelIcon({ as, size, className, ...props }, ref) {
	const { variant: parentVariant } = useStyleContext(SCOPE);
	const IconComponent = as ?? DEFAULT_ICONS[parentVariant as HazardLevelVariant];

	if (typeof size === "number") {
		return (
			<StyledUIIcon
				ref={ref}
				as={IconComponent}
				size={size}
				className={hazardLevelIconStyle({ class: className })}
				{...props}
			/>
		);
	}

	return (
		<StyledUIIcon
			ref={ref}
			as={IconComponent}
			className={hazardLevelIconStyle({
				parentVariants: { variant: parentVariant },
				class: className,
			})}
			{...props}
		/>
	);
});

// ─── Text ─────────────────────────────────────────────────────────────────────

type IWasteCategoryHazardLevelTextProps =
	React.ComponentPropsWithoutRef<typeof Text> &
		VariantProps<typeof hazardLevelTextStyle>;

export const WasteCategoryHazardLevelText = React.forwardRef<
	React.ComponentRef<typeof Text>,
	IWasteCategoryHazardLevelTextProps
>(function WasteCategoryHazardLevelText({ children, className, ...props }, ref) {
	const { variant: parentVariant } = useStyleContext(SCOPE);
	return (
		<Text
			ref={ref}
			className={hazardLevelTextStyle({
				parentVariants: { variant: parentVariant },
				class: className,
			})}
			{...props}
		>
			{children ?? LABELS[parentVariant as HazardLevelVariant]}
		</Text>
	);
});

WasteCategoryHazardLevel.displayName = "WasteCategoryHazardLevel";
WasteCategoryHazardLevelIcon.displayName = "WasteCategoryHazardLevelIcon";
WasteCategoryHazardLevelText.displayName = "WasteCategoryHazardLevelText";

export type {
	IWasteCategoryHazardLevelProps as WasteCategoryHazardLevelProps,
	IWasteCategoryHazardLevelIconProps as WasteCategoryHazardLevelIconProps,
};

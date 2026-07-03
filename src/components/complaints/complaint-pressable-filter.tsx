import { UIIcon } from "@gluestack-ui/core/icon/creator";
import {
	tva,
	useStyleContext,
	type VariantProps,
	withStyleContext,
} from "@gluestack-ui/utils/nativewind-utils";
import {
	ChevronDownIcon,
	ChevronsUpIcon,
	ChevronUpIcon,
	MinusIcon,
	RadarIcon,
	RadiationIcon,
	RecycleIcon,
	SearchIcon,
	Settings2Icon,
	ShieldCheckIcon,
	ShieldIcon,
} from "lucide-react-native";
import { styled } from "nativewind";
import React from "react";
import {
	Pressable,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import type { Svg } from "react-native-svg";
import { colors } from "@/components/style/colors";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { HStack } from "@/components/ui/hstack";
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

// ─── ComplaintFilterRow ───────────────────────────────────────────────────────

const HAZARD_LABELS: Record<"low" | "medium" | "high" | "very_high", string> = {
	low: "Baixa",
	medium: "Média",
	high: "Alta",
	very_high: "Muito alta",
};

const HAZARD_ICONS: Record<
	"low" | "medium" | "high" | "very_high",
	React.ComponentType<object>
> = {
	low: ChevronDownIcon,
	medium: MinusIcon,
	high: ChevronUpIcon,
	very_high: ChevronsUpIcon,
};

const STATUS_LABELS: Record<"OPEN" | "RESOLVED", string> = {
	OPEN: "Aberta",
	RESOLVED: "Resolvida",
};

const STATUS_ICONS: Record<"OPEN" | "RESOLVED", React.ComponentType<object>> = {
	OPEN: ShieldIcon,
	RESOLVED: ShieldCheckIcon,
};

export type ComplaintFilterRowProps = {
	status: "ALL" | "OPEN" | "RESOLVED";
	categoryName: string | null;
	hazardLevel: "all" | "low" | "medium" | "high" | "very_high";
	radiusLabel: string;
	onPress: () => void;
};

export function ComplaintFilterRow({
	status,
	categoryName,
	hazardLevel,
	radiusLabel,
	onPress,
}: ComplaintFilterRowProps) {
	return (
		<HStack className="gap-2 items-center" pointerEvents="auto">
			<HStack
				// activeOpacity={0.9}
				className="h-12 flex-1 flex-row items-center gap-2 bg-white rounded-xl px-3 border border-border"
			>
				<SearchIcon size={16} color={colors.gray[400]} strokeWidth={2} />
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerClassName="gap-1.5 items-center py-2"
				>
					<Badge variant="secondary" className="gap-2">
						<BadgeIcon
							as={
								hazardLevel !== "all"
									? HAZARD_ICONS[hazardLevel]
									: RadiationIcon
							}
						/>
						<BadgeText>
							{hazardLevel !== "all" ? HAZARD_LABELS[hazardLevel] : "Todos"}
						</BadgeText>
					</Badge>
					<Badge variant="secondary" className="gap-2">
						<BadgeIcon as={RecycleIcon} />
						<BadgeText>{categoryName ?? "Todos"}</BadgeText>
					</Badge>
					<Badge variant="secondary" className="gap-2">
						<BadgeIcon
							as={status !== "ALL" ? STATUS_ICONS[status] : ShieldIcon}
						/>
						<BadgeText>
							{status !== "ALL" ? STATUS_LABELS[status] : "Todos"}
						</BadgeText>
					</Badge>
					<Badge variant="secondary" className="gap-2">
						<BadgeIcon as={RadarIcon} />
						<BadgeText>{radiusLabel}</BadgeText>
					</Badge>
				</ScrollView>
			</HStack>

			<TouchableOpacity
				activeOpacity={0.85}
				onPress={onPress}
				className="h-12 w-12 items-center justify-center rounded-xl bg-lime-800"
				style={{
					shadowColor: colors.black,
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.2,
					shadowRadius: 3,
					elevation: 3,
				}}
			>
				<Settings2Icon size={18} color={colors.white} strokeWidth={2} />
			</TouchableOpacity>
		</HStack>
	);
}

ComplaintFilterRow.displayName = "ComplaintFilterRow";

import { ChevronRightIcon, KeyRoundIcon, UserIcon } from "lucide-react-native";
import type { ComponentType } from "react";
import { View } from "react-native";
import { colors } from "@/components/style/colors";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { cn } from "@/libs/utils";

export interface SurveyStagePip {
	code: string;
	icon: ComponentType<{ size?: number; color?: string }>;
	current?: boolean;
	currentLabel?: string;
}

interface SurveyInviteCardProps {
	personaLabel: string;
	title: string;
	description: string;
	participantCode?: string;
	stages: SurveyStagePip[];
	ctaLabel: string;
	onPressCta: () => void;
	onPressDetails: () => void;
	className?: string;
}

export function SurveyInviteCard({
	personaLabel,
	title,
	description,
	participantCode,
	stages,
	ctaLabel,
	onPressCta,
	onPressDetails,
	className,
}: SurveyInviteCardProps) {
	return (
		<Card className={cn("gap-4", className)}>
			<View className="flex-row items-center justify-between">
				<Text size="xs" bold className="uppercase text-muted-foreground">
					Modo pesquisa
				</Text>
				<Badge variant="secondary">
					<BadgeText>{personaLabel}</BadgeText>
				</Badge>
			</View>

			<View className="gap-1">
				<Heading size="md">{title}</Heading>
				<Text size="sm" className="text-muted-foreground">
					{description}
				</Text>
			</View>

			<View className="flex-row gap-4">
				<View className="flex-1 flex-row items-center gap-2">
					<UserIcon size={18} color={colors.gray[400]} />
					<View className="flex-1">
						<Text size="xs" className="uppercase text-muted-foreground">
							Seu perfil
						</Text>
						<Text size="sm" bold numberOfLines={1}>
							{personaLabel}
						</Text>
					</View>
				</View>

				{participantCode ? (
					<View className="flex-1 flex-row items-center gap-2">
						<KeyRoundIcon size={16} color={colors.gray[400]} />
						<View className="flex-1">
							<Text size="xs" className="uppercase text-muted-foreground">
								Seu código
							</Text>
							<Text size="sm" bold numberOfLines={1}>
								{participantCode}
							</Text>
						</View>
					</View>
				) : null}
			</View>

			<View className="flex-row justify-between">
				{stages.map(stage => {
					const StageIcon = stage.icon;
					return (
						<View key={stage.code} className="items-center gap-1">
							<View
								className={cn(
									"size-9 items-center justify-center rounded-full border border-border",
									stage.current && "border-lime-800 bg-lime-800",
								)}
							>
								<StageIcon
									size={16}
									color={stage.current ? colors.white : colors.gray[400]}
								/>
							</View>
							{stage.current && stage.currentLabel ? (
								<Text size="xs" bold>
									{stage.currentLabel}
								</Text>
							) : null}
						</View>
					);
				})}
			</View>

			<Pressable
				onPress={onPressDetails}
				className="flex-row items-center justify-between"
			>
				<Text size="sm" className="text-muted-foreground">
					Ver detalhes da pesquisa
				</Text>
				<ChevronRightIcon size={14} color={colors.gray[400]} />
			</Pressable>

			<Button onPress={onPressCta}>
				<ButtonText>{ctaLabel}</ButtonText>
			</Button>
		</Card>
	);
}

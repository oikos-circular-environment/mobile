import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import {
	CircleCheckIcon,
	CircleDashedIcon,
	CircleDotDashedIcon,
	ClipboardListIcon,
	CopyIcon,
	UserRoundIcon,
} from "lucide-react-native";
import { View } from "react-native";
import { colors } from "@/components/style/colors";
import { toast } from "@/components/toast";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { cn } from "@/libs/utils";

export interface SurveyInviteStage {
	code: string;
	status: "done" | "current" | "upcoming";
	currentLabel?: string;
}

interface SurveyInviteCardProps {
	title: string;
	description: string;
	personaLabel?: string;
	participantCode?: string;
	stages?: SurveyInviteStage[];
	ctaLabel: string;
	onPressCta: () => void;
	className?: string;
}

export function SurveyInviteCard({
	title,
	description,
	personaLabel,
	participantCode,
	stages,
	ctaLabel,
	onPressCta,
	className,
}: SurveyInviteCardProps) {
	const showPersonaBadge = Boolean(personaLabel);
	const showInfoGrid = Boolean(personaLabel || participantCode);
	const showStages = Boolean(stages?.length);

	const handleCopyParticipantCode = async () => {
		if (!participantCode) return;
		await Clipboard.setStringAsync(participantCode);
		toast.success("Código copiado!");
	};

	return (
		<View className={className}>
			<LinearGradient
				colors={[colors.lime[700], colors.lime[900]]}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={{ borderRadius: 16, overflow: "hidden" }}
			>
				<View className="gap-3 p-5">
					<View className="flex-row items-center justify-between">
						<View className="flex-row items-center gap-1.5">
							<ClipboardListIcon size={13} color="#ffffffcc" />
							<Text
								size="xs"
								bold
								className="uppercase tracking-wider text-white/80"
							>
								Modo pesquisa
							</Text>
						</View>

						{showPersonaBadge ? (
							<View className="rounded-full bg-white/15 px-2.5 py-1">
								<Text size="xs" bold className="text-white">
									{personaLabel}
								</Text>
							</View>
						) : null}
					</View>

					<Heading size="lg" className="text-white">
						{title}
					</Heading>
					<Text size="sm" className="leading-5 text-white/80">
						{description}
					</Text>

					{showInfoGrid ? (
						<View className="flex-row gap-2.5">
							{personaLabel ? (
								<View className="flex-1 flex-row items-center justify-between gap-2 rounded-lg bg-white/10 p-3">
									<View className="flex-1 gap-0.5">
										<Text
											size="xs"
											bold
											className="uppercase tracking-wider text-white/70"
										>
											Seu perfil
										</Text>
										<Text
											size="xs"
											bold
											className="text-white"
											numberOfLines={1}
										>
											{personaLabel}
										</Text>
									</View>
									<UserRoundIcon size={18} color="#ffffffcc" />
								</View>
							) : null}

							{participantCode ? (
								<Pressable
									onPress={handleCopyParticipantCode}
									className="flex-1 flex-row items-center justify-between gap-2 rounded-lg bg-white/10 p-3"
								>
									<View className="flex-1 gap-0.5">
										<Text
											size="xs"
											bold
											className="uppercase tracking-wider text-white/70"
										>
											Seu código
										</Text>
										<Text
											size="xs"
											bold
											className="text-white"
											numberOfLines={1}
										>
											{participantCode}
										</Text>
									</View>
									<CopyIcon size={16} color="#ffffffcc" />
								</Pressable>
							) : null}
						</View>
					) : null}

					{showStages ? (
						<View className="w-full flex-row items-center gap-1 self-start rounded-full bg-white/[0.12] p-1">
							{stages?.map(stage => {
								if (stage.status === "current") {
									return (
										<View
											key={stage.code}
											className="flex-row items-center gap-1.5 rounded-full bg-white px-3.5 py-2"
										>
											<CircleDotDashedIcon size={16} color={colors.lime[900]} />
											<Text size="xs" bold className="text-lime-900">
												{stage.currentLabel ?? stage.code}
											</Text>
										</View>
									);
								}

								return (
									<View
										key={stage.code}
										className={cn(
											"size-9 items-center justify-center rounded-full",
											stage.status === "done" && "bg-white/30",
										)}
									>
										{stage.status === "done" ? (
											<CircleCheckIcon size={16} color="#ffffff" />
										) : (
											<CircleDashedIcon size={16} color={colors.yellow[400]} />
										)}
									</View>
								);
							})}
						</View>
					) : null}

					<View className="flex-row justify-end">
						<Button
							variant="secondary"
							className="flex-1 h-12"
							onPress={onPressCta}
						>
							<ButtonText>{ctaLabel}</ButtonText>
						</Button>
					</View>
				</View>
			</LinearGradient>
		</View>
	);
}

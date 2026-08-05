import * as Updates from "expo-updates";
import { useUpdates } from "expo-updates";
import {
	CloudDownloadIcon,
	type LucideIcon,
	SettingsIcon,
	SproutIcon,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, View } from "react-native";
import { Defs, RadialGradient, Rect, Stop, Svg } from "react-native-svg";
import { colors } from "@/components/style/colors";
import { Progress, ProgressFilledTrack } from "@/components/ui/progress";
import { Text } from "@/components/ui/text";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const BOOT_TIMEOUT_MS = 3000;
const INSTALL_BEAT_MS = 450;
const READY_BEAT_MS = 350;
const DEV_DIAGNOSTICS_MS = 900;

type OtaPhase = "idle" | "downloading" | "installing" | "ready";

const PHASE_CONTENT: Record<
	Exclude<OtaPhase, "idle">,
	{ label: string; Icon: LucideIcon }
> = {
	downloading: { label: "Baixando melhorias", Icon: CloudDownloadIcon },
	installing: { label: "Instalando melhorias", Icon: SettingsIcon },
	ready: { label: "Tudo pronto", Icon: SproutIcon },
};

function wait(ms: number) {
	return new Promise<void>(resolve => setTimeout(resolve, ms));
}

type BootSplashScreenProps = {
	onReady: () => void;
};

export function BootSplashScreen({ onReady }: BootSplashScreenProps) {
	if (__DEV__) {
		return <DevBootDiagnostics onReady={onReady} />;
	}
	return <OtaBootSplash onReady={onReady} />;
}

function BootGradient() {
	return (
		<Svg
			style={{
				position: "absolute",
				width: SCREEN_WIDTH,
				height: SCREEN_HEIGHT,
			}}
			width={SCREEN_WIDTH}
			height={SCREEN_HEIGHT}
		>
			<Defs>
				<RadialGradient
					id="bootGradient"
					cx={SCREEN_WIDTH * 0.5}
					cy={SCREEN_HEIGHT * 0.04}
					r={SCREEN_HEIGHT * 0.75}
					gradientUnits="userSpaceOnUse"
				>
					<Stop offset="0%" stopColor={colors.lime[600]} />
					<Stop offset="100%" stopColor={colors.lime[800]} />
				</RadialGradient>
			</Defs>
			<Rect
				width={SCREEN_WIDTH}
				height={SCREEN_HEIGHT}
				fill="url(#bootGradient)"
			/>
		</Svg>
	);
}

// Só roda de verdade fora do __DEV__: checkForUpdateAsync/fetchUpdateAsync
// lançam ERR_UPDATES_DISABLED em desenvolvimento (Expo Go e dev client).
// checkAutomatically está como "NEVER" no app.config.ts — essa é a única
// fonte de verificação de update, não existe outra rodando em paralelo.
function OtaBootSplash({ onReady }: BootSplashScreenProps) {
	const { downloadProgress } = useUpdates();
	const [phase, setPhase] = useState<OtaPhase>("idle");
	const finishedRef = useRef(false);

	const finish = useCallback(() => {
		if (finishedRef.current) return;
		finishedRef.current = true;
		onReady();
	}, [onReady]);

	useEffect(() => {
		let cancelled = false;
		const timeoutId = setTimeout(finish, BOOT_TIMEOUT_MS);

		(async () => {
			try {
				const check = await Updates.checkForUpdateAsync();
				if (cancelled || !check.isAvailable) return;

				setPhase("downloading");
				await Updates.fetchUpdateAsync();
				if (cancelled) return;

				setPhase("installing");
				await wait(INSTALL_BEAT_MS);
				if (cancelled) return;

				setPhase("ready");
				await wait(READY_BEAT_MS);
			} catch {
				// Falha silenciosa em produção: o app segue com o bundle atual.
				// Um download parcial retoma no próximo boot (comportamento
				// padrão do expo-updates).
			} finally {
				clearTimeout(timeoutId);
				finish();
			}
		})();

		return () => {
			cancelled = true;
			clearTimeout(timeoutId);
		};
	}, [finish]);

	const active = phase !== "idle" ? PHASE_CONTENT[phase] : null;
	const progressValue = Math.round((downloadProgress ?? 0) * 100);

	return (
		<View style={{ flex: 1 }}>
			<BootGradient />
			<View className="flex-1 items-center justify-center px-8">
				<View className="w-[261px] items-center gap-2">
					<Text
						className="text-white"
						style={{ fontFamily: "ReemKufi_700Bold", fontSize: 96 }}
						numberOfLines={1}
					>
						Oikos
					</Text>

					{active && (
						<>
							<Progress value={progressValue} className="h-1 w-full">
								<ProgressFilledTrack className="bg-white" />
							</Progress>

							<View className="flex-row items-center gap-2">
								<active.Icon size={12} color="#ffffff" />
								<Text
									className="text-xs text-white"
									style={{ fontFamily: "SpaceGrotesk_400Regular" }}
								>
									{active.label}
								</Text>
							</View>
						</>
					)}
				</View>
			</View>
		</View>
	);
}

// Painel de diagnóstico de boot, só existe no bundle de dev (mesmo padrão de
// FloatingDevTools em _layout.tsx). Updates reais não funcionam em __DEV__,
// então não faz sentido mostrar a sequência de download aqui — em vez disso
// mostra o que costuma ser causa de dor de cabeça: pra qual host o app está
// apontando, se é um launch embutido, canal e runtime version.
function DevBootDiagnostics({ onReady }: BootSplashScreenProps) {
	useEffect(() => {
		const timeoutId = setTimeout(onReady, DEV_DIAGNOSTICS_MS);
		return () => clearTimeout(timeoutId);
	}, [onReady]);

	const rows: [string, string][] = [
		["API", process.env.EXPO_PUBLIC_BASE_URL ?? "—"],
		["Survey", process.env.EXPO_PUBLIC_SURVEY_BASE_URL ?? "—"],
		["Embedded launch", String(Updates.isEmbeddedLaunch)],
		["Channel", Updates.channel ?? "—"],
		["Runtime", Updates.runtimeVersion ?? "—"],
	];

	return (
		<View
			className="flex-1 items-center justify-center gap-6 px-8"
			style={{ backgroundColor: colors.lime[800] }}
		>
			<Text
				className="text-white"
				style={{ fontFamily: "ReemKufi_700Bold", fontSize: 64 }}
			>
				Oikos
			</Text>
			<View className="w-full gap-1 rounded-lg bg-black/20 p-4">
				{rows.map(([label, value]) => (
					<View key={label} className="flex-row justify-between gap-4">
						<Text className="text-xs text-white/70">{label}</Text>
						<Text className="text-xs text-white" numberOfLines={1}>
							{value}
						</Text>
					</View>
				))}
			</View>
		</View>
	);
}

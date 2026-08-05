import { getLoadedFonts, isLoaded as isFontLoaded } from "expo-font";
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
const DEV_READY_HOLD_MS = 700;

const WORDMARK_FONT = "ReemKufi_700Bold";
const LABEL_FONT = "SpaceGrotesk_400Regular";

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

type BootSplashScreenWithFontsProps = BootSplashScreenProps & {
	fontsError?: Error | null;
};

export function BootSplashScreen({
	onReady,
	fontsError,
}: BootSplashScreenWithFontsProps) {
	if (__DEV__) {
		return <DevBootDiagnostics onReady={onReady} fontsError={fontsError} />;
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

// Cai pra fonte do sistema se o Reem Kufi não tiver terminado de carregar —
// numa tela de boot, texto invisível é pior que texto na fonte errada.
function BootWordmark({ fontSize }: { fontSize: number }) {
	const fontFamily = isFontLoaded(WORDMARK_FONT) ? WORDMARK_FONT : undefined;
	return (
		<Text
			className="text-white"
			style={{ fontFamily, fontSize }}
			numberOfLines={1}
		>
			Oikos
		</Text>
	);
}

function BootProgressStatus({
	phase,
	progress,
}: {
	phase: OtaPhase;
	progress: number;
}) {
	if (phase === "idle") return null;
	const { label, Icon } = PHASE_CONTENT[phase];
	return (
		<>
			<Progress value={progress} className="h-1 w-full">
				<ProgressFilledTrack className="bg-white" />
			</Progress>
			<View className="flex-row items-center gap-2">
				<Icon size={12} color="#ffffff" />
				<Text className="text-xs text-white" style={{ fontFamily: LABEL_FONT }}>
					{label}
				</Text>
			</View>
		</>
	);
}

// Só roda de verdade fora do __DEV__: checkForUpdateAsync/fetchUpdateAsync
// lançam ERR_UPDATES_DISABLED em desenvolvimento (Expo Go e dev client).
// checkAutomatically está como "NEVER" no app.config.ts — essa é a única
// fonte de verificação de update, não existe outra rodando em paralelo.
// Exportado (junto com DevBootDiagnostics) para os testes poderem renderizar
// cada variante diretamente, sem depender do valor de __DEV__ no ambiente.
export function OtaBootSplash({ onReady }: BootSplashScreenProps) {
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

	const progressValue = Math.round((downloadProgress ?? 0) * 100);

	return (
		<View style={{ flex: 1 }}>
			<BootGradient />
			<View className="flex-1 items-center justify-center px-8">
				<View className="w-[261px] items-center gap-2">
					<BootWordmark fontSize={96} />
					<BootProgressStatus phase={phase} progress={progressValue} />
				</View>
			</View>
		</View>
	);
}

type DevStep = { phase: OtaPhase; progress: number; holdMs: number };

const DEV_PHASE_SEQUENCE: DevStep[] = [
	{ phase: "idle", progress: 0, holdMs: 300 },
	{ phase: "downloading", progress: 35, holdMs: 450 },
	{ phase: "downloading", progress: 85, holdMs: 400 },
	{ phase: "installing", progress: 100, holdMs: 450 },
	{ phase: "ready", progress: 100, holdMs: 0 },
];

// Updates reais não funcionam em __DEV__, então essa tela simula a mesma
// sequência de produção com dados mockados (idle -> baixando -> instalando ->
// pronto), pra dar uma ideia real de como os componentes vão se comportar, e
// mostra um painel de diagnóstico de boot embaixo — mesmo padrão de
// FloatingDevTools, só existe no bundle dev.
export function DevBootDiagnostics({
	onReady,
	fontsError,
}: BootSplashScreenWithFontsProps) {
	const [step, setStep] = useState(0);
	const current = DEV_PHASE_SEQUENCE[step] ??
		DEV_PHASE_SEQUENCE.at(-1) ?? {
			phase: "ready" as const,
			progress: 100,
			holdMs: 0,
		};
	const isLastStep = step >= DEV_PHASE_SEQUENCE.length - 1;

	useEffect(() => {
		if (isLastStep) {
			const timeoutId = setTimeout(onReady, DEV_READY_HOLD_MS);
			return () => clearTimeout(timeoutId);
		}
		const timeoutId = setTimeout(() => setStep(s => s + 1), current.holdMs);
		return () => clearTimeout(timeoutId);
	}, [isLastStep, current.holdMs, onReady]);

	const loadedFonts = getLoadedFonts();
	const rows: [string, string][] = [
		["Reem Kufi", isFontLoaded(WORDMARK_FONT) ? "carregada" : "FALTANDO"],
		["useFonts error", fontsError ? fontsError.message : "—"],
		["Fontes nativas", loadedFonts.length ? loadedFonts.join(", ") : "nenhuma"],
		["API", process.env.EXPO_PUBLIC_BASE_URL ?? "—"],
		["Survey", process.env.EXPO_PUBLIC_SURVEY_BASE_URL ?? "—"],
		["Embedded launch", String(Updates.isEmbeddedLaunch)],
		["Channel", Updates.channel ?? "—"],
		["Runtime", Updates.runtimeVersion ?? "—"],
	];

	return (
		<View style={{ flex: 1 }}>
			<BootGradient />
			<View className="flex-1 items-center justify-center gap-10 px-8">
				<View className="w-[261px] items-center gap-2">
					<BootWordmark fontSize={96} />
					<BootProgressStatus
						phase={current.phase}
						progress={current.progress}
					/>
				</View>
				<View className="w-full gap-1 rounded-lg bg-black/20 p-4">
					{rows.map(([label, value]) => (
						<View key={label} className="flex-row gap-4">
							<Text className="w-28 shrink-0 text-xs text-white/70">
								{label}
							</Text>
							<Text
								className="flex-1 text-right text-xs text-white"
								numberOfLines={2}
							>
								{value}
							</Text>
						</View>
					))}
				</View>
			</View>
		</View>
	);
}

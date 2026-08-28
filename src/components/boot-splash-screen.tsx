import { getLoadedFonts, isLoaded as isFontLoaded } from "expo-font";
import * as Updates from "expo-updates";
import { useUpdates } from "expo-updates";
import {
	CloudDownloadIcon,
	type LucideIcon,
	SearchIcon,
	SettingsIcon,
	SproutIcon,
} from "lucide-react-native";
import {
	Component,
	type PropsWithChildren,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { Defs, RadialGradient, Rect, Stop, Svg } from "react-native-svg";
import { colors } from "@/components/style/colors";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Orçamentos de tempo escalonados: o check precisa ser curto (não vale segurar
// o boot por uma rede lenta só pra descobrir que não há update), mas o
// download — só iniciado quando já sabemos que há um update — merece um
// orçamento maior pra não cortar no meio.
const CHECK_TIMEOUT_MS = 1200;
const DOWNLOAD_TIMEOUT_MS = 8000;
const INSTALL_BEAT_MS = 450;
const READY_BEAT_MS = 350;
const DEV_READY_HOLD_MS = 700;

const WORDMARK_FONT = "ReemKufi_700Bold";
const LABEL_FONT = "SpaceGrotesk_400Regular";
const CONTENT_WIDTH = 261;

type OtaPhase = "checking" | "downloading" | "installing" | "ready";

const PHASE_CONTENT: Record<OtaPhase, { label: string; Icon: LucideIcon }> = {
	checking: { label: "Verificando se há atualizações", Icon: SearchIcon },
	downloading: { label: "Baixando melhorias", Icon: CloudDownloadIcon },
	installing: { label: "Instalando melhorias", Icon: SettingsIcon },
	ready: { label: "Tudo pronto", Icon: SproutIcon },
};

function wait(ms: number) {
	return new Promise<void>(resolve => setTimeout(resolve, ms));
}

class TimeoutError extends Error {}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
	return new Promise((resolve, reject) => {
		const timeoutId = setTimeout(
			() => reject(new TimeoutError(`timed out after ${ms}ms`)),
			ms,
		);
		promise.then(
			value => {
				clearTimeout(timeoutId);
				resolve(value);
			},
			error => {
				clearTimeout(timeoutId);
				reject(error);
			},
		);
	});
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
	return (
		<BootErrorBoundary onReady={onReady}>
			{__DEV__ ? (
				<DevBootDiagnostics onReady={onReady} fontsError={fontsError} />
			) : (
				<OtaBootSplash onReady={onReady} />
			)}
		</BootErrorBoundary>
	);
}

const BOOT_CRASH_RECOVERY_MS = 800;

// _layout.tsx's <ErrorBoundary> só existe no stage "app" — sem isso, um erro
// aqui deixaria a splash em branco pra sempre em vez de seguir pro app.
class BootErrorBoundary extends Component<
	PropsWithChildren<{ onReady: () => void }>,
	{ hasError: boolean }
> {
	state = { hasError: false };

	static getDerivedStateFromError() {
		return { hasError: true };
	}

	componentDidCatch(error: unknown) {
		console.warn("[boot-splash] erro ao renderizar, seguindo pro app", error);
		setTimeout(this.props.onReady, BOOT_CRASH_RECOVERY_MS);
	}

	render() {
		if (this.state.hasError) {
			return <View style={styles.screen} />;
		}
		return this.props.children;
	}
}

// Este arquivo evita NativeWind/@/components/ui de propósito: é a única tela
// do app que renderiza antes do GluestackUIProvider montar, e isso já causou
// texto invisível mesmo com a fonte carregada.
function BootGradient() {
	return (
		<Svg
			style={StyleSheet.absoluteFill}
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
		<Text style={[styles.wordmark, { fontFamily, fontSize }]} numberOfLines={1}>
			Oikos
		</Text>
	);
}

function BootProgressBar({ progress }: { progress: number }) {
	const clamped = Math.max(0, Math.min(100, progress));
	return (
		<View style={styles.progressTrack}>
			<View style={[styles.progressFill, { width: `${clamped}%` }]} />
		</View>
	);
}

function BootProgressStatus({
	phase,
	progress,
}: {
	phase: OtaPhase;
	progress: number;
}) {
	const { label, Icon } = PHASE_CONTENT[phase];
	return (
		<>
			<BootProgressBar progress={progress} />
			<View style={styles.statusRow}>
				<Icon size={12} color="#ffffff" />
				<Text style={[styles.statusLabel, { fontFamily: LABEL_FONT }]}>
					{label}
				</Text>
			</View>
		</>
	);
}

// Só roda fora do __DEV__: checkForUpdateAsync/fetchUpdateAsync lançam
// ERR_UPDATES_DISABLED em desenvolvimento.
function BootProgressGroup({ children }: PropsWithChildren) {
	return <View style={styles.progressGroup}>{children}</View>;
}

export function OtaBootSplash({ onReady }: BootSplashScreenProps) {
	const { downloadProgress } = useUpdates();
	const [phase, setPhase] = useState<OtaPhase>("checking");
	const finishedRef = useRef(false);

	const finish = useCallback(() => {
		if (finishedRef.current) return;
		finishedRef.current = true;
		onReady();
	}, [onReady]);

	useEffect(() => {
		let cancelled = false;

		(async () => {
			// true só quando o reload realmente começa; controla se o finally
			// abaixo ainda deve chamar finish().
			let reloading = false;
			try {
				const check = await withTimeout(
					Updates.checkForUpdateAsync(),
					CHECK_TIMEOUT_MS,
				);
				if (cancelled || !check.isAvailable) return;

				setPhase("downloading");
				const fetched = await withTimeout(
					Updates.fetchUpdateAsync(),
					DOWNLOAD_TIMEOUT_MS,
				);
				if (cancelled) return;

				setPhase("installing");
				await wait(INSTALL_BEAT_MS);
				if (cancelled) return;

				setPhase("ready");
				await wait(READY_BEAT_MS);
				if (cancelled || !fetched.isNew) return;

				// Sem reload aqui o update baixado só valeria no próximo cold
				// start. Seguro nesta tela: nenhum provider montou ainda, então
				// não há promise nativa em voo pra colidir com o teardown do
				// reload (expo/expo#47315).
				reloading = true;
				await Updates.reloadAsync();
			} catch (err) {
				// Falha silenciosa: mostra o mesmo "pronto" do caminho feliz e
				// segue com o bundle atual. Download/reload parcial retoma no
				// próximo boot.
				reloading = false;
				console.warn(
					"[boot-splash] checagem/download/reload de OTA falhou",
					err,
				);
				if (!cancelled) {
					setPhase("ready");
					await wait(READY_BEAT_MS);
				}
			} finally {
				if (!reloading) finish();
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [finish]);

	const progressValue = Math.round((downloadProgress ?? 0) * 100);

	return (
		<View style={styles.screen}>
			<BootGradient />
			<View style={styles.center}>
				<View style={styles.content}>
					<BootWordmark fontSize={96} />
					<BootProgressGroup>
						<BootProgressStatus phase={phase} progress={progressValue} />
					</BootProgressGroup>
				</View>
			</View>
		</View>
	);
}

type DevStep = { phase: OtaPhase; progress: number; holdMs: number };

const DEV_PHASE_SEQUENCE: DevStep[] = [
	{ phase: "checking", progress: 0, holdMs: 300 },
	{ phase: "downloading", progress: 35, holdMs: 450 },
	{ phase: "downloading", progress: 85, holdMs: 400 },
	{ phase: "installing", progress: 100, holdMs: 450 },
	{ phase: "ready", progress: 100, holdMs: 0 },
];

// Updates reais não funcionam em __DEV__, então simula a mesma sequência com
// dados mockados e mostra um painel de diagnóstico embaixo.
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
		<View style={styles.screen}>
			<BootGradient />
			<View style={styles.center}>
				<View style={styles.devGroup}>
					<View style={styles.content}>
						<BootWordmark fontSize={96} />
						<BootProgressGroup>
							<BootProgressStatus
								phase={current.phase}
								progress={current.progress}
							/>
						</BootProgressGroup>
					</View>
					<View style={styles.debugPanel}>
						{rows.map(([label, value]) => (
							<View key={label} style={styles.debugRow}>
								<Text style={styles.debugLabel}>{label}</Text>
								<Text style={styles.debugValue} numberOfLines={2}>
									{value}
								</Text>
							</View>
						))}
					</View>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
	},
	center: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 32,
	},
	devGroup: {
		width: "100%",
		alignItems: "center",
		gap: 40,
	},
	content: {
		alignItems: "center",
		gap: 8,
	},
	progressGroup: {
		width: CONTENT_WIDTH,
		alignItems: "center",
		gap: 8,
	},
	wordmark: {
		color: "#ffffff",
	},
	progressTrack: {
		width: "100%",
		height: 4,
		borderRadius: 2,
		backgroundColor: "rgba(255,255,255,0.2)",
		overflow: "hidden",
	},
	progressFill: {
		height: "100%",
		borderRadius: 2,
		backgroundColor: "#ffffff",
	},
	statusRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	statusLabel: {
		color: "#ffffff",
		fontSize: 12,
	},
	debugPanel: {
		width: "100%",
		gap: 4,
		borderRadius: 8,
		backgroundColor: "rgba(0,0,0,0.2)",
		padding: 16,
	},
	debugRow: {
		flexDirection: "row",
		gap: 16,
	},
	debugLabel: {
		width: 112,
		flexShrink: 0,
		fontSize: 12,
		color: "rgba(255,255,255,0.7)",
	},
	debugValue: {
		flex: 1,
		textAlign: "right",
		fontSize: 12,
		color: "#ffffff",
	},
});

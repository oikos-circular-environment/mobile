"use client";
import {
	CircleCheck,
	Info,
	OctagonAlert,
	TriangleAlert,
} from "lucide-react-native";
import { useEffect } from "react";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import {
	Toast as GluestackToast,
	ToastDescription,
	ToastTitle,
	useToast,
} from "@/components/ui/toast";
import { VStack } from "@/components/ui/vstack";

type ToastAction = "success" | "error" | "info" | "warning" | "muted";

const getActionStyles = (action: ToastAction) => {
	switch (action) {
		case "success":
			return {
				icon: CircleCheck,
				containerClass: "bg-green-50 border-green-200",
				textClass: "text-green-800",
				iconClass: "text-green-600",
			};
		case "error":
			return {
				icon: OctagonAlert,
				containerClass: "bg-red-50 border-red-200",
				textClass: "text-red-800",
				iconClass: "text-red-600",
			};
		case "warning":
			return {
				icon: TriangleAlert,
				containerClass: "bg-orange-50 border-orange-200",
				textClass: "text-orange-800",
				iconClass: "text-orange-600",
			};
		case "info":
		default:
			return {
				icon: Info,
				containerClass: "bg-blue-50 border-blue-200",
				textClass: "text-blue-800",
				iconClass: "text-blue-600",
			};
	}
};

interface ToastOptions {
	title: string;
	description?: string;
	duration?: number;
	placement?:
		| "top"
		| "top right"
		| "top left"
		| "bottom"
		| "bottom left"
		| "bottom right";
}

interface ToastAPI {
	success: (
		title: string,
		description?: string,
		options?: Partial<ToastOptions>,
	) => void;
	error: (
		title: string,
		description?: string,
		options?: Partial<ToastOptions>,
	) => void;
	info: (
		title: string,
		description?: string,
		options?: Partial<ToastOptions>,
	) => void;
	warning: (
		title: string,
		description?: string,
		options?: Partial<ToastOptions>,
	) => void;
	close: (id: string) => void;
	closeAll: () => void;
}

type ToastBridge = {
	show: (action: ToastAction, options: ToastOptions) => void;
	close: (id: string) => void;
	closeAll: () => void;
};

/** Pilha, não um único valor: uma `<Toaster />` aninhada (ex.: dentro de uma stack
 *  apresentada como `fullScreenModal`, cuja própria `View` fica por cima da raiz)
 *  empurra a sua ponte ao montar e desempilha ao desmontar, devolvendo o controle
 *  pra `<Toaster />` externa em vez de deixar `_toast` apontando pra um bridge morto. */
const toastBridgeStack: ToastBridge[] = [];

const activeBridge = () => toastBridgeStack.at(-1) ?? null;

export const toast: ToastAPI = {
	success: (title, description, options) =>
		activeBridge()?.show("success", {
			title,
			description,
			duration: 3000,
			...options,
		}),
	error: (title, description, options) =>
		activeBridge()?.show("error", {
			title,
			description,
			duration: 4000,
			...options,
		}),
	info: (title, description, options) =>
		activeBridge()?.show("info", {
			title,
			description,
			duration: 3000,
			...options,
		}),
	warning: (title, description, options) =>
		activeBridge()?.show("warning", {
			title,
			description,
			duration: 3500,
			...options,
		}),
	close: id => activeBridge()?.close(id),
	closeAll: () => activeBridge()?.closeAll(),
};

export function Toaster() {
	const t = useToast();

	useEffect(() => {
		const bridge: ToastBridge = {
			show: (
				action,
				{ title, description, duration = 3000, placement = "top" },
			) => {
				const styles = getActionStyles(action);
				t.show({
					placement,
					duration,
					render: ({ id }) => (
						<GluestackToast
							nativeID={id}
							action={action}
							variant="outline"
							className={`flex-row items-center px-4 py-3 rounded-xl border mx-4 ${styles.containerClass}`}
						>
							<HStack space="md" className="items-center">
								<Icon as={styles.icon} className={styles.iconClass} size="md" />
								<VStack className="flex-1">
									<ToastTitle className={`font-semibold ${styles.textClass}`}>
										{title}
									</ToastTitle>
									{description && (
										<ToastDescription className={styles.textClass}>
											{description}
										</ToastDescription>
									)}
								</VStack>
							</HStack>
						</GluestackToast>
					),
				});
			},
			close: id => t.close(id),
			closeAll: () => t.closeAll(),
		};

		toastBridgeStack.push(bridge);
		return () => {
			const index = toastBridgeStack.indexOf(bridge);
			if (index !== -1) toastBridgeStack.splice(index, 1);
		};
	}, [t]);

	return null;
}

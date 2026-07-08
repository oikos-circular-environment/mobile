import { usePathname } from "expo-router";
import { Component, type PropsWithChildren, type ReactNode } from "react";
import { View } from "react-native";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { logAppErrorEvent } from "@/libs/observe-events";

type Props = PropsWithChildren<{ route?: string }>;
type State = { hasError: boolean };

class ErrorBoundaryBase extends Component<Props, State> {
	state: State = { hasError: false };

	static getDerivedStateFromError(): State {
		return { hasError: true };
	}

	componentDidCatch(error: Error) {
		logAppErrorEvent(error.message, this.props.route);
	}

	render(): ReactNode {
		if (this.state.hasError) {
			return (
				<View className="flex-1 items-center justify-center gap-3 bg-background p-6">
					<Heading size="md" className="text-center text-gray-950">
						Algo deu errado
					</Heading>
					<Text className="text-center text-sm text-gray-500">
						Ocorreu um erro inesperado. Tente novamente.
					</Text>
					<Button
						className="bg-lime-800 rounded-md"
						onPress={() => this.setState({ hasError: false })}
					>
						<ButtonText>Tentar novamente</ButtonText>
					</Button>
				</View>
			);
		}

		return this.props.children;
	}
}

export function ErrorBoundary({ children }: PropsWithChildren) {
	const route = usePathname();
	return <ErrorBoundaryBase route={route}>{children}</ErrorBoundaryBase>;
}

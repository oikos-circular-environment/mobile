import { usePathname } from "expo-router";
import {
	Component,
	type ErrorInfo,
	type PropsWithChildren,
	type ReactNode,
} from "react";
import { ErrorFallback } from "@/components/error-fallback";
import { recordAppError } from "@/libs/moderation/record-app-error";

type Props = PropsWithChildren<{ route?: string }>;
type State = { hasError: boolean };

class ErrorBoundaryBase extends Component<Props, State> {
	state: State = { hasError: false };

	static getDerivedStateFromError(): State {
		return { hasError: true };
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		recordAppError(
			error,
			this.props.route,
			info.componentStack ?? undefined,
			"fatal",
		);
	}

	render(): ReactNode {
		if (this.state.hasError) {
			return (
				<ErrorFallback onRetry={() => this.setState({ hasError: false })} />
			);
		}

		return this.props.children;
	}
}

export function ErrorBoundary({ children }: PropsWithChildren) {
	const route = usePathname();
	return <ErrorBoundaryBase route={route}>{children}</ErrorBoundaryBase>;
}

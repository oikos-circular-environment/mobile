import {
	createContext,
	type PropsWithChildren,
	useContext,
	useEffect,
	useState,
} from "react";

const ClockContext = createContext<Date | null>(null);

export function ClockProvider({ children }: PropsWithChildren) {
	const [now, setNow] = useState(() => new Date());

	useEffect(() => {
		const timer = setInterval(() => {
			setNow(new Date());
		}, 60000);

		return () => {
			clearInterval(timer);
		};
	}, []);

	return <ClockContext.Provider value={now}>{children}</ClockContext.Provider>;
}

export function useNow() {
	const now = useContext(ClockContext);

	if (!now) {
		throw new Error("useNow must be used within ClockProvider");
	}

	return now;
}

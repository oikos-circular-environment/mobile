import { useObserve } from "expo-observe";
import { useEffect } from "react";

export function useRouteInteractive(ready = true) {
	const { markInteractive } = useObserve();

	useEffect(() => {
		if (ready) {
			markInteractive();
		}
	}, [ready, markInteractive]);
}

import { notifyManager } from "@tanstack/query-core";
import { configure } from "@testing-library/react-native";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Make TanStack Query notifications synchronous so state updates from
// mutations fire within the current act() scope instead of via setTimeout,
// preventing "overlapping act()" warnings and open handle warnings.
notifyManager.setScheduler(callback => callback());

configure({
	asyncUtilTimeout: 3000,
});

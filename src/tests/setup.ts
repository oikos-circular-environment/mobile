import { configure } from "@testing-library/react-native";

// React 19 concurrent mode: tells the reconciler that this environment
// supports act(), suppressing spurious "not configured to support act()" warnings.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

configure({
	asyncUtilTimeout: 3000,
});

import { createContext, useContext, useState } from "react";

interface TabBarContextValue {
	isTabBarHidden: boolean;
	updateTabBarHidden: (hidden: boolean) => void;
}

const TabBarContext = createContext<TabBarContextValue | null>(
	{} as TabBarContextValue,
);

interface TabBarProviderProps {
	children: React.ReactNode;
}
export function TabBarProvider({ children }: TabBarProviderProps) {
	const [localIsTabBarHidden, setLocalIsTabBarHidden] = useState(false);

	const updateTabBarHidden = (hidden: boolean) => {
		setLocalIsTabBarHidden(hidden);
	};

	return (
		<TabBarContext.Provider
			value={{
				isTabBarHidden: localIsTabBarHidden,
				updateTabBarHidden: updateTabBarHidden,
			}}
		>
			{children}
		</TabBarContext.Provider>
	);
}

export function useTabBar() {
	const context = useContext(TabBarContext);

	if (!context) {
		throw new Error("useTabBar must be used within TabBarProvider");
	}

	return context;
}

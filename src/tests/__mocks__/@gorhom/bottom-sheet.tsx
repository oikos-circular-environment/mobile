import React from "react";
import { ScrollView, View } from "react-native";

// Minimal mock for @gorhom/bottom-sheet — renders children as plain Views
// so tests can verify content without native gesture/animation modules.

export const BottomSheetScrollView = ScrollView;

export const BottomSheetHandle = View;

export const BottomSheetBackdrop = View;

export const BottomSheetTextInput = View;

export const BottomSheetView = View;

export const BottomSheetFooter = View;

export const BottomSheetFlatList = View;

export const BottomSheetSectionList = View;

type BottomSheetProps = {
	children?: React.ReactNode;
};

const GorhomBottomSheet = React.forwardRef<unknown, BottomSheetProps>(
	({ children }, ref) => {
		return <View>{children}</View>;
	},
);
GorhomBottomSheet.displayName = "GorhomBottomSheet";

export default GorhomBottomSheet;

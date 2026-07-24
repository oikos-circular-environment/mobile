import React, { useImperativeHandle, useState } from "react";
import { ScrollView, TextInput, View } from "react-native";

export const BottomSheetScrollView = ScrollView;

export const BottomSheetHandle = View;

export const BottomSheetBackdrop = View;

export const BottomSheetTextInput = TextInput;

export const BottomSheetView = View;

export const BottomSheetFooter = View;

export const BottomSheetFlatList = View;

export const BottomSheetSectionList = View;

type BottomSheetProps = {
	children?: React.ReactNode;
	index?: number;
	snapPoints?: (string | number)[];
	enablePanDownToClose?: boolean;
	enableDynamicSizing?: boolean;
	backdropComponent?: React.ComponentType<unknown>;
	onChange?: (index: number) => void;
	onClose?: () => void;
	style?: object;
	backgroundStyle?: object;
	handleIndicatorStyle?: object;
};

const GorhomBottomSheet = React.forwardRef<unknown, BottomSheetProps>(
	({ children, index = -1, onChange, onClose }, ref) => {
		const [currentIndex, setCurrentIndex] = useState(index);

		useImperativeHandle(ref, () => ({
			snapToIndex: (idx: number) => {
				setCurrentIndex(idx);
				onChange?.(idx);
			},
			close: () => {
				setCurrentIndex(-1);
				onChange?.(-1);
				onClose?.();
			},
			open: () => {
				setCurrentIndex(0);
				onChange?.(0);
			},
			expand: () => setCurrentIndex(0),
			collapse: () => setCurrentIndex(-1),
		}));

		if (currentIndex < 0) return null;
		return <View>{children}</View>;
	},
);
GorhomBottomSheet.displayName = "GorhomBottomSheet";

export default GorhomBottomSheet;

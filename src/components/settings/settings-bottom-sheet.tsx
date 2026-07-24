import BottomSheet, {
	BottomSheetBackdrop,
	type BottomSheetBackdropProps,
	BottomSheetView,
} from "@gorhom/bottom-sheet";
import { LogOutIcon, UserRoundIcon } from "lucide-react-native";
import { forwardRef, useCallback } from "react";
import { View } from "react-native";
import { SettingOptionRow } from "@/components/settings/setting-option-row";

type SettingsBottomSheetProps = {
	onOpenAccount: () => void;
	onSignOut: () => void;
};

export const SettingsBottomSheet = forwardRef<
	BottomSheet,
	SettingsBottomSheetProps
>(({ onOpenAccount, onSignOut }, ref) => {
	const backdropComponent = useCallback(
		(props: BottomSheetBackdropProps) => (
			<BottomSheetBackdrop
				{...props}
				appearsOnIndex={0}
				disappearsOnIndex={-1}
			/>
		),
		[],
	);

	return (
		<BottomSheet
			ref={ref}
			index={-1}
			enableDynamicSizing
			enablePanDownToClose
			backdropComponent={backdropComponent}
		>
			<BottomSheetView>
				<View className="p-4 pb-8 gap-2">
					<SettingOptionRow
						icon={UserRoundIcon}
						title="Conta"
						description="E-mail, senha e exclusão da conta"
						showChevron
						onPress={onOpenAccount}
					/>
					<SettingOptionRow
						icon={LogOutIcon}
						title="Sair da conta"
						tone="neutral"
						onPress={onSignOut}
					/>
				</View>
			</BottomSheetView>
		</BottomSheet>
	);
});

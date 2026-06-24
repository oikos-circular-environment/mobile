import BottomSheet, {
	BottomSheetBackdrop,
	type BottomSheetBackdropProps,
	BottomSheetView,
} from "@gorhom/bottom-sheet";
import { differenceInDays } from "date-fns";
import { LogOutIcon, Trash2Icon, UndoIcon } from "lucide-react-native";
import { forwardRef, useCallback } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { colors } from "@/components/style/colors";
import { Text } from "@/components/ui/text";
import { useAuthContext } from "@/contexts/auth-context";

const DELETION_GRACE_PERIOD_DAYS = 90;

type SettingsBottomSheetProps = {
	onSignOut: () => void;
	onDeleteAccount: () => void;
};

export const SettingsBottomSheet = forwardRef<
	BottomSheet,
	SettingsBottomSheetProps
>(({ onSignOut, onDeleteAccount }, ref) => {
	const {
		deletionScheduledAt,
		cancelDeletion,
		isCancellingDeletion,
	} = useAuthContext();

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

	const remainingDays = deletionScheduledAt
		? Math.max(
				DELETION_GRACE_PERIOD_DAYS -
					differenceInDays(new Date(), deletionScheduledAt),
				0,
			)
		: null;

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
					<Pressable
						className="flex-row items-center gap-3 p-4 rounded-xl bg-gray-50 active:bg-gray-100"
						onPress={onSignOut}
					>
						<LogOutIcon size={20} color={colors.gray[700]} />
						<Text className="font-semibold text-gray-700">Sair da conta</Text>
					</Pressable>

					{deletionScheduledAt ? (
						<Pressable
							className="flex-row items-center gap-3 p-4 rounded-xl bg-amber-50 active:bg-amber-100"
							onPress={cancelDeletion}
							disabled={isCancellingDeletion}
						>
							{isCancellingDeletion ? (
								<ActivityIndicator size="small" color={colors.amber[700]} />
							) : (
								<UndoIcon size={20} color={colors.amber[700]} />
							)}
							<View className="flex-1">
								<Text className="font-semibold text-amber-700">
									Cancelar exclusão da conta
								</Text>
								<Text className="text-xs text-amber-600">
									{remainingDays === 1
										? "Falta 1 dia para a exclusão permanente"
										: `Faltam ${remainingDays} dias para a exclusão permanente`}
								</Text>
							</View>
						</Pressable>
					) : (
						<Pressable
							className="flex-row items-center gap-3 p-4 rounded-xl bg-red-50 active:bg-red-100"
							onPress={onDeleteAccount}
						>
							<Trash2Icon size={20} color={colors.red[600]} />
							<Text className="font-semibold text-red-600">
								Excluir minha conta
							</Text>
						</Pressable>
					)}
				</View>
			</BottomSheetView>
		</BottomSheet>
	);
});

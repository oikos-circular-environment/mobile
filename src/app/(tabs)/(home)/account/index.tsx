import type BottomSheetType from "@gorhom/bottom-sheet";
import { differenceInDays } from "date-fns";
import {
	LockIcon,
	Trash2Icon,
	TriangleAlertIcon,
	UndoIcon,
} from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import { ChangePasswordBottomSheet } from "@/components/settings/change-password-bottom-sheet";
import { DeleteAccountModal } from "@/components/settings/delete-account-modal";
import { SettingOptionRow } from "@/components/settings/setting-option-row";
import { colors } from "@/components/style/colors";
import { Text } from "@/components/ui/text";
import { useAuthContext } from "@/contexts/auth-context";
import { useRouteInteractive } from "@/hooks/use-route-interactive";

const DELETION_GRACE_PERIOD_DAYS = 90;

export default function AccountScreen() {
	useRouteInteractive();
	const {
		account,
		deletionScheduledAt,
		requestDeletion,
		isRequestingDeletion,
		cancelDeletion,
		isCancellingDeletion,
	} = useAuthContext();
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const changePasswordSheetRef = useRef<BottomSheetType>(null);

	const handleOpenChangePassword = useCallback(() => {
		changePasswordSheetRef.current?.snapToIndex(0);
	}, []);

	const handleChangePasswordSuccess = useCallback(() => {
		changePasswordSheetRef.current?.close();
	}, []);

	const handleConfirmDeletion = useCallback(() => {
		requestDeletion();
		setShowDeleteModal(false);
	}, [requestDeletion]);

	const remainingDays = deletionScheduledAt
		? Math.max(
				DELETION_GRACE_PERIOD_DAYS -
					differenceInDays(new Date(), deletionScheduledAt),
				0,
			)
		: null;

	return (
		<>
			<ScrollView
				className="flex-1 bg-white"
				contentContainerClassName="px-4 pt-6 pb-8 gap-6"
			>
				<View className="gap-1">
					<Text className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
						E-mail
					</Text>
					<Text className="text-[17px] font-semibold text-gray-900">
						{account?.email}
					</Text>
					<Text className="text-xs text-gray-500">
						É com este e-mail que você entra no app.
					</Text>
				</View>

				<View className="h-px bg-gray-200" />

				<View className="gap-2">
					<Text className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
						Segurança
					</Text>
					<SettingOptionRow
						icon={LockIcon}
						title="Mudar senha"
						description="As outras sessões serão desconectadas"
						showChevron
						onPress={handleOpenChangePassword}
					/>
				</View>

				<View className="gap-2">
					<Text className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
						{deletionScheduledAt ? "Exclusão agendada" : "Exclusão da conta"}
					</Text>

					{deletionScheduledAt ? (
						<>
							<View className="flex-row items-start gap-3 p-4 rounded-xl bg-amber-50">
								<TriangleAlertIcon size={20} color={colors.amber[600]} />
								<View className="flex-1 gap-1">
									<Text className="font-semibold text-amber-700">
										{remainingDays === 1
											? "Falta 1 dia"
											: `Faltam ${remainingDays} dias`}
									</Text>
									<Text className="text-xs text-amber-700">
										Sua conta continua funcionando normalmente até a exclusão
										permanente.
									</Text>
								</View>
							</View>
							<SettingOptionRow
								icon={UndoIcon}
								title="Cancelar exclusão da conta"
								tone="warning"
								isLoading={isCancellingDeletion}
								onPress={cancelDeletion}
							/>
						</>
					) : (
						<SettingOptionRow
							icon={Trash2Icon}
							title="Excluir minha conta"
							description="Você tem 90 dias para voltar atrás"
							tone="danger"
							onPress={() => setShowDeleteModal(true)}
						/>
					)}
				</View>
			</ScrollView>

			<ChangePasswordBottomSheet
				ref={changePasswordSheetRef}
				onSuccess={handleChangePasswordSuccess}
			/>

			<DeleteAccountModal
				isOpen={showDeleteModal}
				onClose={() => setShowDeleteModal(false)}
				onConfirm={handleConfirmDeletion}
				isLoading={isRequestingDeletion}
			/>
		</>
	);
}

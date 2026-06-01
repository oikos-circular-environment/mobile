import { useMutation } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { CameraIcon } from "lucide-react-native";
import { useState } from "react";
import {
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/components/style/colors";
import { toast } from "@/components/toast";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { useAuthContext } from "@/contexts/auth-context";
import { postV1ComplaintsByIdResolutions } from "@/libs/oikos-sdk";

export default function ComplaintResolutionScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const insets = useSafeAreaInsets();
	const { user, isAuthenticated } = useAuthContext();

	const [description, setDescription] = useState("");

	const mutation = useMutation({
		mutationFn: async () => {
			if (!id || !user?.profile.id) throw new Error("Dados inválidos.");
			await postV1ComplaintsByIdResolutions({
				path: { id },
				body: {
					description,
					resolver: user.profile.id,
					rating: 5,
				},
			});
		},
		onSuccess: () => {
			toast.success("Resolução publicada!", "Sua resolução foi registrada.");
			router.back();
		},
		onError: () => {
			toast.error("Erro", "Não foi possível publicar a resolução.");
		},
	});

	const canSubmit =
		isAuthenticated && description.trim().length >= 10 && !mutation.isPending;

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			className="flex-1"
		>
			<View className="flex-1 bg-background">
				<ScrollView
					contentContainerClassName="gap-6 px-4 pt-6"
					contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
				>
					{/* Description */}
					<View className="gap-2">
						<Text className="text-base font-bold text-gray-900">Descrição</Text>
						<TextInput
							value={description}
							onChangeText={setDescription}
							placeholder="Descreva como a denúncia foi resolvida..."
							placeholderTextColor={colors.gray[400]}
							multiline
							numberOfLines={5}
							textAlignVertical="top"
							className="min-h-[120px] rounded-lg border border-gray-300 p-3 text-sm leading-5 text-gray-900"
						/>
						<Text className="text-xs text-gray-400">
							{description.trim().length < 10
								? `Mínimo de 10 caracteres (${description.trim().length}/10)`
								: `${description.trim().length} caracteres`}
						</Text>
					</View>

					{/* Attachments placeholder */}
					<View className="gap-2">
						<Text className="text-sm font-bold text-gray-800">Anexos</Text>
						<TouchableOpacity
							activeOpacity={0.8}
							className="h-[88px] items-center justify-center gap-2 rounded-lg border-dashed bg-gray-50"
							style={{ borderWidth: 1.5, borderColor: colors.gray[200] }}
						>
							<CameraIcon size={22} color={colors.gray[400]} strokeWidth={2} />
							<Text className="text-[13px] text-gray-400">
								Adicione fotos ou vídeos da resolução
							</Text>
						</TouchableOpacity>
					</View>

					{!isAuthenticated && (
						<View className="rounded-lg bg-amber-50 p-3">
							<Text className="text-center text-[13px] text-amber-700">
								Faça login para publicar uma resolução.
							</Text>
						</View>
					)}
				</ScrollView>

				{/* Submit button */}
				<View
					className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-4 pt-3"
					style={{ paddingBottom: insets.bottom + 12 }}
				>
					<TouchableOpacity
						onPress={() => mutation.mutate()}
						disabled={!canSubmit}
						activeOpacity={0.85}
						className={`h-12 items-center justify-center rounded-[10px] ${canSubmit ? "bg-lime-800" : "bg-gray-200"}`}
					>
						{mutation.isPending ? (
							<Spinner size="small" />
						) : (
							<Text
								className={`text-[15px] font-bold ${canSubmit ? "text-white" : "text-gray-400"}`}
							>
								Confirmar Resolução
							</Text>
						)}
					</TouchableOpacity>
				</View>
			</View>
		</KeyboardAvoidingView>
	);
}

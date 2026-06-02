import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import {
	AlertTriangleIcon,
	BuildingIcon,
	CalendarIcon,
	ChevronDownIcon,
	ImageIcon,
	InfoIcon,
	MapPinIcon,
	X,
	XIcon,
} from "lucide-react-native";
import { useState } from "react";
import {
	Image,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	TouchableOpacity,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Company } from "@/components/complaints/company-picker-bottom-sheet";
import { CompanyPickerBottomSheet } from "@/components/complaints/company-picker-bottom-sheet";
import { ComplaintStatusChip } from "@/components/complaints/complaint-chip/complaint-status-chip";
import { ComplaintTypeChip } from "@/components/complaints/complaint-chip/complaint-type-chip";
import { MediaThumbnail } from "@/components/medias-preview/media-thumbnail";
import { colors } from "@/components/style/colors";
import { toast } from "@/components/toast";
import { Alert, AlertIcon, AlertText } from "@/components/ui/alert";
import { Heading } from "@/components/ui/heading";
import { Input, InputField } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { useAuthContext } from "@/contexts/auth-context";
import {
	postV1ComplaintsByIdResolutions,
	postV1ComplaintsByIdResolutionsAttachments,
} from "@/libs/oikos-sdk";
import type { ComplaintStatus, ComplaintType } from "@/libs/types/complaint";
import { complaintTypeValues } from "@/libs/types/complaint";

const MIN_ATTACHMENTS = 2;

export default function ComplaintResolutionScreen() {
	const { id, type, status, address, date } = useLocalSearchParams<{
		id: string;
		type: string;
		status: string;
		address: string;
		date: string;
	}>();
	const insets = useSafeAreaInsets();
	const { user, isAuthenticated } = useAuthContext();
	const queryClient = useQueryClient();

	const [description, setDescription] = useState("");
	const [selectedAssets, setSelectedAssets] = useState<
		ImagePicker.ImagePickerAsset[]
	>([]);
	const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
	const [showCompanyPicker, setShowCompanyPicker] = useState(false);

	const typeInfo = complaintTypeValues.find(v => v.value === type);
	const title =
		typeInfo?.description?.toLocaleUpperCase() ??
		typeInfo?.label?.toLocaleUpperCase() ??
		type;

	const dateLabel = date
		? format(new Date(date), "d 'de' MMMM 'de' yyyy, 'às' HH:mm", {
				locale: ptBR,
			})
		: null;

	const handlePickMedia = async () => {
		const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (!perm.granted) {
			toast.error(
				"Permissão negada",
				"Permita o acesso à galeria nas configurações.",
			);
			return;
		}
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images", "videos"],
			allowsMultipleSelection: true,
			quality: 0.85,
			orderedSelection: true,
		});
		if (!result.canceled) {
			setSelectedAssets(prev => {
				const existingUris = new Set(prev.map(a => a.uri));
				return [
					...prev,
					...result.assets.filter(a => !existingUris.has(a.uri)),
				];
			});
		}
	};

	const handleRemoveAsset = (uri: string) => {
		setSelectedAssets(prev => prev.filter(a => a.uri !== uri));
	};

	const mutation = useMutation({
		mutationFn: async () => {
			if (!id || !user?.profile.id) throw new Error("Dados inválidos.");

			await postV1ComplaintsByIdResolutions({
				path: { id },
				body: {
					description,
					...(selectedCompany ? { company_id: selectedCompany.id } : {}),
				},
			});

			for (const asset of selectedAssets) {
				const isPhoto = asset.type === "image";
				const ext = isPhoto ? "jpg" : "mp4";
				const formData = new FormData();
				formData.append("file", {
					uri: asset.uri,
					name: asset.fileName ?? `resolution_${id}_${Date.now()}.${ext}`,
					type: isPhoto ? "image/jpeg" : "video/mp4",
				} as unknown as Blob);
				await postV1ComplaintsByIdResolutionsAttachments({
					path: { id },
					body: formData as unknown as undefined,
				});
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["complaint", "public", id] });
			toast.success("Resolução publicada!", "Sua resolução foi registrada.");
			router.back();
		},
		onError: () => {
			toast.error("Erro", "Não foi possível publicar a resolução.");
		},
	});

	const canSubmit =
		isAuthenticated &&
		description.trim().length >= 10 &&
		selectedAssets.length >= MIN_ATTACHMENTS &&
		!mutation.isPending;

	const attachmentsMissing = MIN_ATTACHMENTS - selectedAssets.length;

	return (
		<>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				className="flex-1 bg-white"
			>
				<ScrollView
					className="flex-1 gap-4 px-4 pb-6"
					contentContainerClassName="flex-col gap-4"
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
				>
					{/* Header — dados da denúncia */}
					<View className="gap-2">
						<Text
							className="text-2xl font-bold text-gray-950"
							style={{ fontFamily: "Oswald_700Bold" }}
						>
							{title}
						</Text>

						<View className="flex-row items-center gap-1.5">
							{type ? (
								<ComplaintTypeChip type={type as ComplaintType} size="sm" />
							) : null}
							{status ? (
								<ComplaintStatusChip
									status={status as ComplaintStatus}
									size="sm"
								/>
							) : null}
						</View>

						{!!address && (
							<View className="flex-row items-center gap-1.5">
								<MapPinIcon
									size={13}
									color={colors.gray[500]}
									strokeWidth={2}
								/>
								<Text
									className="flex-1 text-sm text-gray-500"
									numberOfLines={1}
								>
									{address}
								</Text>
							</View>
						)}

						{!!dateLabel && (
							<View className="flex-row items-center gap-1.5">
								<CalendarIcon
									size={13}
									color={colors.gray[500]}
									strokeWidth={2}
								/>
								<Text className="text-sm text-gray-500">{dateLabel}</Text>
							</View>
						)}
					</View>

					{/* Info contextual */}
					<Alert className="flex-row items-start gap-2 rounded-lg border border-sky-700 bg-sky-50 p-3">
						<AlertIcon as={InfoIcon} className="text-sky-700" />
						<AlertText className="flex-1 text-sky-700">
							Deixe a comunidade saber quem resolveu e como resolveu, assim
							conseguimos inspirar voluntários e órgãos competentes a ajudarem
							na solução de um ambiente mais limpo e seguro.
						</AlertText>
					</Alert>

					{/* Aviso de publicidade */}
					<Alert className="flex-row items-start gap-2 rounded-lg border border-amber-500 bg-amber-50 p-3">
						<AlertIcon as={AlertTriangleIcon} className="text-amber-600" />
						<AlertText className="flex-1 text-amber-700">
							As resoluções serão públicas, utilize este local apenas para
							postagens íntegras que levarão à resolução da denúncia.
						</AlertText>
					</Alert>

					{/* Descrição */}
					<View className="gap-2">
						<Heading size="md">Descrição</Heading>
						<Input className="min-h-[100px]">
							<InputField
								value={description}
								onChangeText={setDescription}
								placeholder="Descreva como a denúncia foi resolvida..."
								multiline
								numberOfLines={4}
								textAlignVertical="top"
								maxLength={1000}
							/>
						</Input>
					</View>

					{/* Empresa vinculada (opcional) */}
					<View className="gap-2">
						<Heading size="md">Empresa responsável</Heading>
						<Text className="text-sm text-gray-500">
							Opcional — vincule uma empresa caso ela tenha participado da
							resolução.
						</Text>

						{selectedCompany ? (
							<View className="flex-row items-center gap-3 rounded-xl border border-lime-700 bg-lime-50 p-3">
								{selectedCompany.avatar?.url ? (
									<Image
										source={{ uri: selectedCompany.avatar.url }}
										style={{ width: 36, height: 36, borderRadius: 18 }}
									/>
								) : (
									<View className="h-9 w-9 items-center justify-center rounded-full bg-lime-100">
										<BuildingIcon
											size={16}
											color={colors.lime[800]}
											strokeWidth={2}
										/>
									</View>
								)}
								<View className="flex-1">
									<Text className="font-semibold text-lime-900">
										{selectedCompany.business_name ??
											selectedCompany.corporate_name}
									</Text>
									<Text className="text-xs text-lime-700">
										{selectedCompany.company_type}
									</Text>
								</View>
								<TouchableOpacity
									onPress={() => setSelectedCompany(null)}
									hitSlop={8}
								>
									<XIcon size={16} color={colors.lime[800]} strokeWidth={2} />
								</TouchableOpacity>
							</View>
						) : (
							<TouchableOpacity
								onPress={() => setShowCompanyPicker(true)}
								activeOpacity={0.8}
								className="h-11 flex-row items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4"
							>
								<Text className="text-sm text-gray-400">
									Selecionar empresa...
								</Text>
								<ChevronDownIcon
									size={16}
									color={colors.gray[400]}
									strokeWidth={2}
								/>
							</TouchableOpacity>
						)}
					</View>

					{/* Anexos */}
					<View className="gap-2">
						<View className="flex-row items-center justify-between">
							<Heading size="md">Anexos</Heading>
							<Text
								className={`text-sm ${
									selectedAssets.length >= MIN_ATTACHMENTS
										? "text-lime-700"
										: "text-red-500"
								}`}
							>
								{selectedAssets.length}/{MIN_ATTACHMENTS} mínimo
							</Text>
						</View>

						{attachmentsMissing > 0 && selectedAssets.length > 0 && (
							<Text className="text-xs text-red-500">
								Adicione mais {attachmentsMissing}{" "}
								{attachmentsMissing === 1 ? "anexo" : "anexos"} para continuar.
							</Text>
						)}

						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerClassName="gap-2"
							nestedScrollEnabled
							keyboardShouldPersistTaps="always"
						>
							<Pressable
								onPress={handlePickMedia}
								className="items-center justify-center rounded-xl border border-gray-200 bg-gray-50"
								style={{ width: 80, height: 80 }}
							>
								<ImageIcon
									size={24}
									color={colors.gray[400]}
									strokeWidth={1.5}
								/>
							</Pressable>

							{selectedAssets.map(asset => (
								<View
									key={asset.uri}
									className="relative"
									style={{ width: 80, height: 80 }}
								>
									<View className="flex-1 overflow-hidden rounded-xl">
										<MediaThumbnail
											mediaType={asset.type === "video" ? "video" : "photo"}
											uri={asset.uri}
											fallbackLabel={asset.type === "video" ? "VÍD" : "IMG"}
										/>
									</View>
									<TouchableOpacity
										className="absolute -right-1 -top-1 items-center justify-center rounded-full bg-red-500 p-0.5"
										onPress={() => handleRemoveAsset(asset.uri)}
									>
										<X size={12} color={colors.white} strokeWidth={2.5} />
									</TouchableOpacity>
								</View>
							))}
						</ScrollView>
					</View>

					<TouchableOpacity
						onPress={() => mutation.mutate()}
						disabled={!canSubmit}
						activeOpacity={0.85}
						className={`h-12 items-center justify-center rounded-[10px] ${canSubmit ? "bg-lime-800" : "bg-gray-200"}`}
						style={{ marginBottom: insets.bottom || 16 }}
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
				</ScrollView>
			</KeyboardAvoidingView>

			<CompanyPickerBottomSheet
				isOpen={showCompanyPicker}
				onClose={() => setShowCompanyPicker(false)}
				onSelect={company => setSelectedCompany(company)}
				selectedCompanyId={selectedCompany?.id}
			/>
		</>
	);
}

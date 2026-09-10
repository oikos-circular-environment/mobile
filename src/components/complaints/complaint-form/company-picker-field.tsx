import { BuildingIcon, ChevronDownIcon, XIcon } from "lucide-react-native";
import { TouchableOpacity, View } from "react-native";
import type { Company } from "@/components/complaints/company-picker-bottom-sheet";
import { colors } from "@/components/style/colors";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Text } from "@/components/ui/text";
import { getAuthenticatedImageHeaders } from "@/libs/api/oikos-api";

export type CompanyPickerFieldProps = {
	company: Company | null;
	onPress: () => void;
	onClear: () => void;
};

export function CompanyPickerField({
	company,
	onPress,
	onClear,
}: CompanyPickerFieldProps) {
	if (company) {
		return (
			<View className="flex-row items-center gap-3 rounded-xl border border-lime-700 bg-lime-50 p-3">
				<Avatar size="sm" className="h-9 w-9 rounded-full bg-lime-100">
					<BuildingIcon size={16} color={colors.lime[800]} strokeWidth={2} />
					{company.avatar?.url && (
						<AvatarImage
							source={{
								uri: company.avatar.url,
								headers: getAuthenticatedImageHeaders(),
							}}
						/>
					)}
				</Avatar>
				<View className="flex-1">
					<Text className="font-semibold text-lime-900">
						{company.business_name ?? company.corporate_name}
					</Text>
					<Text className="text-xs text-lime-700">{company.company_type}</Text>
				</View>
				<TouchableOpacity onPress={onClear} hitSlop={8}>
					<XIcon size={16} color={colors.lime[800]} strokeWidth={2} />
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<TouchableOpacity
			onPress={onPress}
			activeOpacity={0.8}
			className="h-11 flex-row items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4"
		>
			<Text className="text-sm text-gray-400">Selecionar empresa...</Text>
			<ChevronDownIcon size={16} color={colors.gray[400]} strokeWidth={2} />
		</TouchableOpacity>
	);
}

import { UploadIcon } from "lucide-react-native";
import { View } from "react-native";
import { colors } from "@/components/style/colors";
import { Heading } from "@/components/ui/heading";
import {
	Modal,
	ModalBackdrop,
	ModalBody,
	ModalContent,
} from "@/components/ui/modal";
import { Progress, ProgressFilledTrack } from "@/components/ui/progress";
import { Text } from "@/components/ui/text";
import type { UploadProgress } from "./hooks/upload-progress";

const PHASE_LABELS = {
	compressing: "Comprimindo mídias",
	uploading: "Enviando mídias",
} as const;

type MediaUploadProgressProps = {
	progress: UploadProgress | null;
};

export function MediaUploadProgress({ progress }: MediaUploadProgressProps) {
	if (!progress) return null;

	const percentage = Math.round((progress.current / progress.total) * 100);

	return (
		<Modal isOpen onClose={() => {}} size="sm">
			<ModalBackdrop />
			<ModalContent>
				<ModalBody>
					<View className="items-center gap-4 py-6">
						<View className="size-12 items-center justify-center rounded-full bg-lime-100">
							<UploadIcon size={22} color={colors.lime[800]} strokeWidth={2} />
						</View>

						<View className="items-center gap-1">
							<Heading size="sm">{PHASE_LABELS[progress.phase]}</Heading>
							<Text className="text-sm text-gray-500">
								{progress.current}/{progress.total}
							</Text>
						</View>

						<Progress value={percentage} className="w-full">
							<ProgressFilledTrack className="bg-lime-800" />
						</Progress>
					</View>
				</ModalBody>
			</ModalContent>
		</Modal>
	);
}

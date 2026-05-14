"use client";

import { router } from "expo-router";
import { EyeIcon, Trash2Icon } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { MediaThumbnail } from "@/components/common";
import { Menu, MenuItem, MenuItemLabel } from "@/components/ui/menu";
import { Pressable } from "@/components/ui/pressable";
import type { ComplaintCapture } from "@/libs/types/complaint";
import { cn } from "@/libs/utils";

type ComplaintCaptureCarouselProps = {
	captures: ComplaintCapture[];
	selectedCaptureId: string;
	onSelectCapture: (captureId: string) => void;
	onDeleteCapture: (captureId: string) => void;
};

const getCaptureUri = (capture: ComplaintCapture) =>
	capture.capture.object?.uri;

export function ComplaintCarousel({
	captures,
	selectedCaptureId,
	onDeleteCapture,
	onSelectCapture,
}: ComplaintCaptureCarouselProps) {
	const [openMenuCaptureId, setOpenMenuCaptureId] = useState("");

	return (
		<ScrollView
			horizontal
			nestedScrollEnabled
			keyboardShouldPersistTaps="handled"
			showsHorizontalScrollIndicator={false}
		>
			<View className="flex-row gap-2 pr-4">
				{captures.map(capture => {
					const captureUri = getCaptureUri(capture);
					const isSelected = capture.id === selectedCaptureId;

					return (
						<Menu
							key={capture.id}
							placement="bottom"
							offset={8}
							useRNModal
							isOpen={openMenuCaptureId === capture.id}
							onClose={() => {
								setOpenMenuCaptureId(current =>
									current === capture.id ? "" : current,
								);
							}}
							trigger={triggerProps => {
								const { onLongPress: _onLongPress, ...restTriggerProps } =
									triggerProps;

								return (
									<Pressable
										className={cn(
											"size-24 p-0.5 overflow-hidden rounded-lg border",
											isSelected ? "border-lime-800" : "border-gray-200",
										)}
										{...restTriggerProps}
										onPress={() => onSelectCapture(capture.id)}
										onLongPress={() => {
											onSelectCapture(capture.id);
											setOpenMenuCaptureId(capture.id);
										}}
										delayLongPress={260}
										hitSlop={6}
									>
										<MediaThumbnail
											mediaType={capture.capture.type}
											uri={captureUri}
											loadingLabel="Carregando"
											fallbackLabel="Vídeo"
										/>
									</Pressable>
								);
							}}
						>
							<MenuItem
								key={`preview-${capture.id}`}
								textValue="Previsualizar"
								onPress={() => {
									onSelectCapture(capture.id);
									setOpenMenuCaptureId("");
									router.push({
										pathname: "/(tabs)/complaints/(create)/preview",
										params: { captureId: capture.id },
									});
								}}
							>
								<View className="flex-row items-center gap-2">
									<EyeIcon size={14} strokeWidth={2.2} />
									<MenuItemLabel>Previsualizar</MenuItemLabel>
								</View>
							</MenuItem>

							<MenuItem
								key={`delete-${capture.id}`}
								textValue="Deletar captura"
								onPress={() => {
									setOpenMenuCaptureId("");
									onDeleteCapture(capture.id);
								}}
							>
								<View className="flex-row items-center gap-2">
									<Trash2Icon size={14} color="#DC2626" strokeWidth={2.2} />
									<MenuItemLabel className="text-red-600">
										Deletar captura
									</MenuItemLabel>
								</View>
							</MenuItem>
						</Menu>
					);
				})}
			</View>
		</ScrollView>
	);
}

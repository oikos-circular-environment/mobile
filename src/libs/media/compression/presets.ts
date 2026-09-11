/**
 * "evidence" — complaint/resolution media: 1920px wide, 80% quality
 * "avatar"   — profile/company pictures:  512px wide, 85% quality
 */
export type CompressionPreset = "evidence" | "avatar";

export const IMAGE_PRESETS: Record<
	CompressionPreset,
	{ maxWidth: number; quality: number }
> = {
	evidence: { maxWidth: 1920, quality: 0.8 },
	avatar: { maxWidth: 512, quality: 0.85 },
};

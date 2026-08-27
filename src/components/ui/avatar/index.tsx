"use client";
import { createAvatar } from "@gluestack-ui/core/avatar/creator";
import { tva, type VariantProps } from "@gluestack-ui/utils/nativewind-utils";
import { Image as ExpoImage } from "expo-image";
import { styled } from "nativewind";
import React from "react";
import { View } from "react-native";

const StyledExpoImage = styled(ExpoImage, {
	className: "style",
});

const UIAvatar = createAvatar({
	Root: View,
	Badge: View,
	Group: View,
	Image: StyledExpoImage,
	FallbackText: View,
});

const avatarStyle = tva({
	base: "items-center justify-center overflow-hidden rounded-md bg-secondary",
	variants: {
		size: {
			sm: "h-11 w-11",
			md: "h-18 w-18",
			lg: "h-20 w-20",
		},
	},
});

const avatarImageStyle = tva({
	base: "absolute inset-0 h-full w-full",
});

type IAvatarProps = React.ComponentPropsWithoutRef<typeof UIAvatar> &
	VariantProps<typeof avatarStyle>;

const Avatar = React.forwardRef<
	React.ComponentRef<typeof UIAvatar>,
	IAvatarProps
>(function Avatar({ className, size, ...props }, ref) {
	return (
		<UIAvatar
			ref={ref}
			{...props}
			className={avatarStyle({ size, class: className })}
		/>
	);
});

type IAvatarImageProps = React.ComponentPropsWithoutRef<
	typeof UIAvatar.Image
> &
	VariantProps<typeof avatarImageStyle>;

const AvatarImage = React.forwardRef<
	React.ComponentRef<typeof UIAvatar.Image>,
	IAvatarImageProps
>(function AvatarImage({ className, contentFit = "cover", ...props }, ref) {
	return (
		<UIAvatar.Image
			ref={ref}
			{...props}
			contentFit={contentFit}
			className={avatarImageStyle({ class: className })}
		/>
	);
});

export { Avatar, AvatarImage };

import React from "react";
import {
	Button as GluestackButton,
	ButtonGroup as GluestackButtonGroup,
	ButtonIcon as GluestackButtonIcon,
	ButtonSpinner as GluestackButtonSpinner,
	ButtonText as GluestackButtonText,
} from "@/components/ui/button";

type GluestackButtonProps = React.ComponentPropsWithoutRef<
	typeof GluestackButton
>;

// O Button do gluestack só aplica `data-[disabled=true]:opacity-40` a partir de
// `isDisabled`, nunca da prop nativa `disabled` — o botão bloqueia o toque mas nunca
// aparece esmaecido. Fix mora aqui, e não em `ui/button`, porque esse é vendorizado.
const AppButton = React.forwardRef<
	React.ElementRef<typeof GluestackButton>,
	GluestackButtonProps
>(({ disabled, ...props }, ref) => {
	const isDisabled = disabled ?? undefined;
	return (
		<GluestackButton
			ref={ref}
			disabled={isDisabled}
			isDisabled={isDisabled}
			{...props}
		/>
	);
});
AppButton.displayName = "AppButton";

const AppButtonText = GluestackButtonText;
const AppButtonSpinner = GluestackButtonSpinner;
const AppButtonIcon = GluestackButtonIcon;
const AppButtonGroup = GluestackButtonGroup;

export {
	AppButton,
	AppButtonGroup,
	AppButtonIcon,
	AppButtonSpinner,
	AppButtonText,
};

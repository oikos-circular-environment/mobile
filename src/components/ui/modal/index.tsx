"use client";
import { createModal } from "@gluestack-ui/core/modal/creator";
import { tva, type VariantProps } from "@gluestack-ui/utils/nativewind-utils";
import React from "react";
import { Pressable, View } from "react-native";

const UIModal = createModal({
  Root: View,
  Content: View,
  CloseButton: Pressable,
  Header: View,
  Footer: View,
  Body: View,
  Backdrop: Pressable,
});

const modalStyle = tva({
  base: "flex-1 items-center justify-center px-4",
});

const modalBackdropStyle = tva({
  base: "absolute bottom-0 left-0 right-0 top-0 bg-black/55",
});

const modalContentStyle = tva({
  base: "w-11/12 max-w-[420px] rounded-xl border border-gray-200 bg-white p-4 shadow-2xl",
});

const modalHeaderStyle = tva({
  base: "flex-row items-center justify-between",
});

const modalBodyStyle = tva({
  base: "",
});

const modalFooterStyle = tva({
  base: "",
});

const modalCloseButtonStyle = tva({
  base: "size-8 items-center justify-center rounded-md bg-gray-100",
});

type IModalProps = React.ComponentProps<typeof UIModal> &
  VariantProps<typeof modalStyle> & { className?: string };

const Modal = React.forwardRef<React.ComponentRef<typeof UIModal>, IModalProps>(
  function Modal({ className, ...props }, ref) {
    return (
      <UIModal
        ref={ref}
        {...props}
        className={modalStyle({
          class: className,
        })}
      />
    );
  },
);

type IModalBackdropProps = React.ComponentProps<typeof UIModal.Backdrop> &
  VariantProps<typeof modalBackdropStyle> & { className?: string };

const ModalBackdrop = React.forwardRef<
  React.ComponentRef<typeof UIModal.Backdrop>,
  IModalBackdropProps
>(function ModalBackdrop({ className, ...props }, ref) {
  return (
    <UIModal.Backdrop
      ref={ref}
      {...props}
      className={modalBackdropStyle({ class: className })}
    />
  );
});

type IModalContentProps = React.ComponentProps<typeof UIModal.Content> &
  VariantProps<typeof modalContentStyle> & { className?: string };

const ModalContent = React.forwardRef<
  React.ComponentRef<typeof UIModal.Content>,
  IModalContentProps
>(function ModalContent({ className, ...props }, ref) {
  return (
    <UIModal.Content
      ref={ref}
      {...props}
      className={modalContentStyle({ class: className })}
    />
  );
});

type IModalHeaderProps = React.ComponentProps<typeof UIModal.Header> &
  VariantProps<typeof modalHeaderStyle> & { className?: string };

const ModalHeader = React.forwardRef<
  React.ComponentRef<typeof UIModal.Header>,
  IModalHeaderProps
>(function ModalHeader({ className, ...props }, ref) {
  return (
    <UIModal.Header
      ref={ref}
      {...props}
      className={modalHeaderStyle({ class: className })}
    />
  );
});

type IModalBodyProps = React.ComponentProps<typeof UIModal.Body> &
  VariantProps<typeof modalBodyStyle> & { className?: string };

const ModalBody = React.forwardRef<
  React.ComponentRef<typeof UIModal.Body>,
  IModalBodyProps
>(function ModalBody({ className, ...props }, ref) {
  return (
    <UIModal.Body
      ref={ref}
      {...props}
      className={modalBodyStyle({ class: className })}
    />
  );
});

type IModalFooterProps = React.ComponentProps<typeof UIModal.Footer> &
  VariantProps<typeof modalFooterStyle> & { className?: string };

const ModalFooter = React.forwardRef<
  React.ComponentRef<typeof UIModal.Footer>,
  IModalFooterProps
>(function ModalFooter({ className, ...props }, ref) {
  return (
    <UIModal.Footer
      ref={ref}
      {...props}
      className={modalFooterStyle({ class: className })}
    />
  );
});

type IModalCloseButtonProps = React.ComponentProps<typeof UIModal.CloseButton> &
  VariantProps<typeof modalCloseButtonStyle> & { className?: string };

const ModalCloseButton = React.forwardRef<
  React.ComponentRef<typeof UIModal.CloseButton>,
  IModalCloseButtonProps
>(function ModalCloseButton({ className, ...props }, ref) {
  return (
    <UIModal.CloseButton
      ref={ref}
      {...props}
      className={modalCloseButtonStyle({ class: className })}
    />
  );
});

Modal.displayName = "Modal";
ModalBackdrop.displayName = "ModalBackdrop";
ModalContent.displayName = "ModalContent";
ModalHeader.displayName = "ModalHeader";
ModalBody.displayName = "ModalBody";
ModalFooter.displayName = "ModalFooter";
ModalCloseButton.displayName = "ModalCloseButton";

export {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
};

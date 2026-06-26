"use client";

import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, useDialogA11yIds } from "@/components/ui/Dialog";

export function AppModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}) {
  const { titleId, descriptionId } = useDialogA11yIds();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-labelledby={titleId} aria-describedby={descriptionId} className={className}>
        <DialogHeader>
          <DialogTitle id={titleId}>{title}</DialogTitle>
          {description ? <DialogDescription id={descriptionId}>{description}</DialogDescription> : null}
        </DialogHeader>
        {children}
        {footer ? <div className="mt-6 flex justify-end gap-3">{footer}</div> : null}
      </DialogContent>
    </Dialog>
  );
}

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  isSubmitting = false,
  variant = "secondary",
}) {
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      className="max-w-md"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {cancelLabel}
          </Button>
          <Button type="button" variant={variant} onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Working..." : confirmLabel}
          </Button>
        </>
      }
    />
  );
}

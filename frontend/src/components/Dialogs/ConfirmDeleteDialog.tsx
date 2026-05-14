'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export const ConfirmDeleteDialog = ({
  open,
  onOpenChange,
  onConfirm,
  title = 'Are you absolutely sure?',
  description = 'This action cannot be undone. This will permanently delete the item and remove the data from our servers.',
}: ConfirmDeleteDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="p-0 border-none bg-background overflow-hidden">
        <div className="bg-primary p-6 rounded-t-xl text-background">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold tracking-tight">{title}</AlertDialogTitle>
            <AlertDialogDescription className="text-background/70 text-sm mt-1">{description}</AlertDialogDescription>
          </AlertDialogHeader>
        </div>
        <div className="p-6 pt-0">
          <AlertDialogFooter className="pt-6">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirm}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

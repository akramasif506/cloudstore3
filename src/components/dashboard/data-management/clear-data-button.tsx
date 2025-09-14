"use client";

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';

interface ClearDataButtonProps {
  action: () => Promise<{ success: boolean; message: string }>;
  buttonText: string;
  dialogTitle: string;
  dialogDescription: string;
}

export function ClearDataButton({
  action,
  buttonText,
  dialogTitle,
  dialogDescription,
}: ClearDataButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleAction = async () => {
    setIsSubmitting(true);
    const result = await action();
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Success!",
        description: result.message,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Operation Failed",
        description: result.message,
      });
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">{buttonText}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
          <AlertDialogDescription>{dialogDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleAction} disabled={isSubmitting} className={buttonVariants({ variant: "destructive" })}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

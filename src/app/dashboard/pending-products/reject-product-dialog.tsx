
"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, XCircle } from 'lucide-react';
import { rejectProduct } from './actions';

interface RejectProductDialogProps {
  productId: string;
  onSuccess: (productId: string) => void;
  onError: (message: string) => void;
}

export function RejectProductDialog({ productId, onSuccess, onError }: RejectProductDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reason, setReason] = useState('');

    async function handleReject() {
        if (!reason) {
            onError('Please provide a reason for rejection.');
            return;
        }

        setIsSubmitting(true);
        const result = await rejectProduct(productId, reason);
        if (result.success) {
            onSuccess(productId);
            setOpen(false);
        } else {
            onError(result.message || 'An unknown error occurred.');
        }
        setIsSubmitting(false);
    }
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="destructive">
                    <XCircle className="mr-2 h-4 w-4" /> Reject
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Reject Product</DialogTitle>
                    <DialogDescription>
                        Provide a reason for rejecting this listing. This will be visible to the seller.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="reason" className="text-right">
                            Reason
                        </Label>
                        <Textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="col-span-3"
                            placeholder="e.g. Image is blurry, description is incomplete."
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="button" variant="destructive" onClick={handleReject} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Rejection
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

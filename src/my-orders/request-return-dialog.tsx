
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
import { Loader2, Undo2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { requestReturn } from './actions';

interface RequestReturnDialogProps {
  orderId: string;
  onSuccess: () => void;
}

export function RequestReturnDialog({ orderId, onSuccess }: RequestReturnDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reason, setReason] = useState('');
    const { toast } = useToast();

    async function handleSubmit() {
        if (reason.length < 10) {
            toast({
                variant: 'destructive',
                title: 'Reason Required',
                description: 'Please provide a reason of at least 10 characters for your return request.',
            });
            return;
        }

        setIsSubmitting(true);
        const result = await requestReturn({ orderId, reason });
        setIsSubmitting(false);

        if (result.success) {
            toast({
                title: 'Request Submitted!',
                description: result.message,
            });
            onSuccess();
            setOpen(false);
        } else {
            toast({
                variant: 'destructive',
                title: 'Submission Failed',
                description: result.message,
            });
        }
    }
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Undo2 className="mr-2 h-4 w-4" />
                    Request Return
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Request a Return</DialogTitle>
                    <DialogDescription>
                        Explain why you would like to return this order. Your reason will be sent to the admin for review.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="reason">Reason for Return</Label>
                        <Textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g., The item arrived damaged, it's not as described, etc."
                            rows={4}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Request
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

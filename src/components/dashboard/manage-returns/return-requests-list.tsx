"use client";

import { useState } from 'react';
import type { ReturnRequest } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { updateReturnStatus } from '@/app/dashboard/manage-returns/actions';
import { Loader2, CheckCircle, XCircle, Info } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Image from 'next/image';

interface ReturnRequestsListProps {
  initialRequests: ReturnRequest[];
}

const statusStyles = {
    Pending: 'bg-amber-100 text-amber-800',
    Approved: 'bg-green-100 text-green-800',
    Rejected: 'bg-red-100 text-red-800',
};

export function ReturnRequestsList({ initialRequests }: ReturnRequestsListProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleStatusUpdate = async (request: ReturnRequest, newStatus: 'Approved' | 'Rejected') => {
    setUpdatingId(request.id);
    const result = await updateReturnStatus(request.id, request.orderId, request.userId, newStatus);
    setUpdatingId(null);
    
    if (result.success) {
      setRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: newStatus } : r));
      toast({ title: 'Success', description: result.message });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
  };

  if (requests.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-20 flex flex-col items-center">
        <CheckCircle className="h-12 w-12 mb-4 text-green-500" />
        <h3 className="text-xl font-semibold">All Caught Up!</h3>
        <p>There are no pending return requests.</p>
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {requests.map((request) => (
        <AccordionItem value={request.id} key={request.id}>
          <AccordionTrigger>
             <div className="flex flex-wrap items-center gap-4 w-full pr-4">
                <div className="font-medium">#{request.order.id}</div>
                <div className="text-muted-foreground">{request.order.customerName}</div>
                <div className="text-sm text-muted-foreground truncate hidden md:block" style={{ flexBasis: '200px' }}>
                    {request.reason}
                </div>
                 <div className="ml-auto flex items-center gap-4">
                    <Badge variant="secondary" className={statusStyles[request.status]}>
                        {request.status}
                    </Badge>
                    <div className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(request.requestedAt).toLocaleDateString()}
                    </div>
                </div>
             </div>
          </AccordionTrigger>
          <AccordionContent className="p-4 bg-muted/50">
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <h4 className="font-semibold mb-2">Items in Order</h4>
                    <div className="space-y-2">
                        {request.order.items.map(item => (
                            <div key={item.id} className="flex items-center gap-3 p-2 bg-background rounded-md">
                                <Image src={item.imageUrl} alt={item.name} width={40} height={40} className="rounded object-cover" />
                                <div>
                                    <p className="text-sm font-medium">{item.name}</p>
                                    <p className="text-xs text-muted-foreground">Qty: {item.quantity} - Rs{item.price.toFixed(2)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold mb-2">Customer's Reason for Return</h4>
                    <p className="text-sm p-3 bg-background rounded-md border">{request.reason}</p>

                    {request.status === 'Pending' && (
                        <div className="mt-4 flex gap-4">
                            <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={() => handleStatusUpdate(request, 'Rejected')}
                                disabled={updatingId === request.id}
                            >
                                {updatingId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                                Reject
                            </Button>
                             <Button 
                                variant="default" 
                                size="sm" 
                                onClick={() => handleStatusUpdate(request, 'Approved')}
                                disabled={updatingId === request.id}
                             >
                                {updatingId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                Approve
                            </Button>
                        </div>
                    )}
                </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

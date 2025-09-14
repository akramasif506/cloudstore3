
// src/components/dashboard/recent-returns.tsx
import type { ReturnRequest } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '../ui/badge';
import { getPendingReturnRequests } from '@/app/dashboard/manage-returns/actions';
import { Undo2 } from 'lucide-react';

export async function RecentReturns() {
  const requests = await getPendingReturnRequests();
  
  if (requests.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">No pending return requests.</p>
  }

  return (
    <div className="border rounded-lg">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {requests.slice(0, 5).map((request) => (
                    <TableRow key={request.id}>
                        <TableCell className="font-medium">#{request.orderId.substring(0, 8)}</TableCell>
                        <TableCell>{request.order.customerName}</TableCell>
                        <TableCell>{new Date(request.requestedAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </div>
  );
}

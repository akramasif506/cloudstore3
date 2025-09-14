
import { Undo2, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getReturnPolicy } from './actions';
import { ReturnPolicyForm } from '@/components/dashboard/manage-returns/return-policy-form';
import { Separator } from '@/components/ui/separator';
import { ReturnRequestsList } from '@/components/dashboard/manage-returns/return-requests-list';
import { getAllReturnRequests } from './actions';

export default async function ManageReturnPolicyPage() {
  const [policy, returnRequests] = await Promise.all([
    getReturnPolicy(),
    getAllReturnRequests(),
  ]);

  return (
    <div className="space-y-8">
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
                        <Undo2 className="h-6 w-6" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-headline">Manage Return Policy</CardTitle>
                        <CardDescription>
                        Define the terms and conditions for product returns.
                        </CardDescription>
                    </div>
                    </div>
                    <Button asChild variant="outline">
                        <Link href="/dashboard">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <ReturnPolicyForm currentPolicy={policy} />
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl font-headline">Pending Return Requests</CardTitle>
                <CardDescription>
                  Review, approve, or reject customer return requests here.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ReturnRequestsList initialRequests={returnRequests} />
            </CardContent>
        </Card>
    </div>
  );
}

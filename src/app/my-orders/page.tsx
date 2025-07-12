import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

export default function MyOrdersPage() {
  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-4">
            <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-headline">My Orders</h1>
              <p className="text-muted-foreground">View your purchase history.</p>
            </div>
          </div>
      </div>

      <Card className="flex flex-col items-center justify-center text-center py-20">
        <CardHeader>
            <CardTitle>No Orders Yet</CardTitle>
            <CardDescription>You haven't made any purchases.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

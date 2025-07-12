import { ListingForm } from './listing-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FilePlus2 } from 'lucide-react';

export default function NewListingPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
              <FilePlus2 className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-headline">Add a New Product</CardTitle>
              <CardDescription>Fill out the details below to add an item to the store. Use our AI assistant for help!</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ListingForm />
        </CardContent>
      </Card>
    </div>
  );
}

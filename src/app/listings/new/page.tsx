
import { ListingForm } from './listing-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FilePlus2, Wand2 } from 'lucide-react';

export default function NewListingPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
              <Wand2 className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-headline">Create a New Listing with AI</CardTitle>
              <CardDescription>Just describe your item and upload a photo. Our AI will do the rest!</CardDescription>
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


import { ListingForm } from './listing-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FilePlus2 } from 'lucide-react';
import { getCategories } from '@/app/dashboard/manage-categories/actions';
import { getVariantSets } from '@/app/dashboard/manage-variants/actions';

export default async function NewListingPage() {
  const [categories, variantSets] = await Promise.all([
    getCategories(),
    getVariantSets(),
  ]);

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
              <FilePlus2 className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-headline">Create a New Listing</CardTitle>
              <CardDescription>Fill out the form below to list your item for sale.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ListingForm categories={categories} variantSets={variantSets} />
        </CardContent>
      </Card>
    </div>
  );
}

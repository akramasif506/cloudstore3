
import { Palette, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getVariantSets } from './actions';
import { VariantForm } from '@/components/dashboard/manage-variants/variant-form';

export default async function ManageVariantsPage() {
  const variantSets = await getVariantSets();

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
                <Palette className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-headline">Manage Variants</CardTitle>
                <CardDescription>
                  Create and manage reusable sets of product options like sizes and colors.
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
        <VariantForm initialVariantSets={variantSets} />
      </CardContent>
    </Card>
  );
}

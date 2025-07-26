
import { FolderKanban, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getCategories, getVariantSetsForCategories } from './actions';
import { CategoryForm } from './category-form';

export default async function ManageCategoriesPage() {
  const [categories, variantSets] = await Promise.all([
    getCategories(),
    getVariantSetsForCategories(),
  ]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
                <FolderKanban className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-headline">Manage Categories</CardTitle>
                <CardDescription>
                  Add, edit, or delete product categories and subcategories.
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
        <CategoryForm initialCategories={categories} variantSets={variantSets} />
      </CardContent>
    </Card>
  );
}



import { ShieldAlert, BookUser } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAboutPageContent, type AboutPageContent } from './actions';
import { AboutPageForm } from './about-page-form';

export default async function ManageAboutPage() {
  const currentContent = await getAboutPageContent();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
            <BookUser className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-2xl font-headline">Manage About Page</CardTitle>
            <CardDescription>
              Update the content and hero image of the public "About Us" page.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <AboutPageForm currentContent={currentContent} />
      </CardContent>
    </Card>
  );
}

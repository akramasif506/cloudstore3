

import { DatabaseZap, ArrowLeft, Package, ShoppingCart, MessageSquare, Undo2, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ClearDataButton } from './clear-data-button';
import { deleteAllProducts, deleteAllOrders, deleteAllMessages, deleteAllReturnRequests } from './actions';

export default async function DataManagementPage() {
  return (
    <Card className="border-destructive">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 bg-destructive/10 text-destructive rounded-lg p-3">
              <DatabaseZap className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-headline">Data Management</CardTitle>
              <CardDescription>
                Permanently delete transactional data from your database.
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
      <CardContent className="space-y-8">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Warning: This is a destructive action</AlertTitle>
          <AlertDescription>
            The actions on this page are permanent and cannot be undone. This tool is intended for resetting your application before a production launch. It does not affect user accounts.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Package/> All Products</CardTitle>
              <CardDescription>Deletes all product listings from the database.</CardDescription>
            </CardHeader>
            <CardFooter>
              <ClearDataButton
                action={deleteAllProducts}
                buttonText="Delete All Products"
                dialogTitle="Are you sure you want to delete all products?"
                dialogDescription="This will permanently remove all product listings. This action cannot be undone."
              />
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShoppingCart/> All Orders</CardTitle>
              <CardDescription>Deletes all order records for all users.</CardDescription>
            </CardHeader>
            <CardFooter>
               <ClearDataButton
                action={deleteAllOrders}
                buttonText="Delete All Orders"
                dialogTitle="Are you sure you want to delete all orders?"
                dialogDescription="This will permanently remove all past and present orders. This action cannot be undone."
              />
            </CardFooter>
          </Card>

           <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MessageSquare/> All Messages</CardTitle>
              <CardDescription>Deletes all messages from the contact form.</CardDescription>
            </CardHeader>
            <CardFooter>
              <ClearDataButton
                action={deleteAllMessages}
                buttonText="Delete All Messages"
                dialogTitle="Are you sure you want to delete all contact messages?"
                dialogDescription="This will permanently remove all messages from the database. This action cannot be undone."
              />
            </CardFooter>
          </Card>
          
           <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Undo2/> All Return Requests</CardTitle>
              <CardDescription>Deletes all return request records.</CardDescription>
            </CardHeader>
            <CardFooter>
              <ClearDataButton
                action={deleteAllReturnRequests}
                buttonText="Delete All Returns"
                dialogTitle="Are you sure you want to delete all return requests?"
                dialogDescription="This will permanently remove all return requests from the database. This action cannot be undone."
              />
            </CardFooter>
          </Card>

        </div>
      </CardContent>
    </Card>
  );
}


"use client";

import { useState, useTransition, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Info, Users, Shield, User, Trash2, Search } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User as AppUser } from '@/lib/types';
import { setSellerSettings, type SellerSettings } from './actions';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

const sellerSettingsSchema = z.object({
  mode: z.enum(['admins_only', 'all_users', 'specific_users']),
  allowed_sellers: z.record(z.boolean()),
});

type FormValues = z.infer<typeof sellerSettingsSchema>;

interface SellerSettingsFormProps {
    initialSettings: SellerSettings;
    allUsers: AppUser[];
}

export function SellerSettingsForm({ initialSettings, allUsers }: SellerSettingsFormProps) {
  const [isSaving, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(sellerSettingsSchema),
    defaultValues: {
        mode: initialSettings.mode || 'admins_only',
        allowed_sellers: initialSettings.allowed_sellers || {},
    },
  });

  const watchMode = form.watch('mode');
  const watchAllowedSellers = form.watch('allowed_sellers');

  const handleUserToggle = (userId: string, isChecked: boolean) => {
    const currentSellers = form.getValues('allowed_sellers');
    if (isChecked) {
      form.setValue('allowed_sellers', { ...currentSellers, [userId]: true });
    } else {
      const { [userId]: _, ...newSellers } = currentSellers;
      form.setValue('allowed_sellers', newSellers);
    }
  };
  
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return allUsers;
    const lowercasedQuery = searchQuery.toLowerCase();
    return allUsers.filter(user => 
        user.name.toLowerCase().includes(lowercasedQuery) || 
        user.email.toLowerCase().includes(lowercasedQuery)
    );
  }, [allUsers, searchQuery]);
  
  const onSubmit = async (data: FormValues) => {
    startTransition(async () => {
      const result = await setSellerSettings(data);
      if (result.success) {
        toast({ title: "Success!", description: result.message });
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>How it works</AlertTitle>
            <AlertDescription>
                Choose who can list items for sale. This setting controls when the "Sell" button appears in the header for users.
            </AlertDescription>
        </Alert>

        <FormField
          control={form.control}
          name="mode"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="text-base">Seller Permissions</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  <FormItem>
                    <Label className={cn(
                        "flex flex-col items-center justify-center rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                        field.value === 'admins_only' ? 'border-primary' : 'border-muted'
                    )}>
                      <FormControl>
                        <RadioGroupItem value="admins_only" className="sr-only" />
                      </FormControl>
                      <Shield className="mb-3 h-6 w-6" />
                      Admins Only
                    </Label>
                  </FormItem>
                  <FormItem>
                    <Label className={cn(
                        "flex flex-col items-center justify-center rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                        field.value === 'all_users' ? 'border-primary' : 'border-muted'
                    )}>
                      <FormControl>
                        <RadioGroupItem value="all_users" className="sr-only" />
                      </FormControl>
                      <Users className="mb-3 h-6 w-6" />
                      All Logged-in Users
                    </Label>
                  </FormItem>
                  <FormItem>
                    <Label className={cn(
                        "flex flex-col items-center justify-center rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                        field.value === 'specific_users' ? 'border-primary' : 'border-muted'
                    )}>
                      <FormControl>
                        <RadioGroupItem value="specific_users" className="sr-only" />
                      </FormControl>
                      <User className="mb-3 h-6 w-6" />
                      Specific Users
                    </Label>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {watchMode === 'specific_users' && (
          <Card>
            <CardHeader>
              <CardTitle>Manage Approved Sellers</CardTitle>
              <CardDescription>Select which users are allowed to sell products on the marketplace.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search users..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
              <ScrollArea className="h-72 w-full rounded-md border">
                    <div className="p-4 space-y-2">
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map(user => (
                                <div key={user.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={user.profileImageUrl} />
                                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium">{user.name}</p>
                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                        </div>
                                    </div>
                                    <Checkbox
                                        checked={!!watchAllowedSellers[user.id]}
                                        onCheckedChange={(checked) => handleUserToggle(user.id, !!checked)}
                                        id={`user-checkbox-${user.id}`}
                                        aria-label={`Approve ${user.name}`}
                                    />
                                </div>
                            ))
                        ) : (
                             <p className="p-4 text-center text-sm text-muted-foreground">No users found for this search.</p>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
        </div>
      </form>
    </Form>
  );
}

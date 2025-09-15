
"use client";

import { useState, useTransition, useMemo, useEffect } from 'react';
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
import { Loader2, Info, Users, Shield, User, Trash2, Search, PlusCircle, UserX, UserCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User as AppUser } from '@/lib/types';
import { setSellerSettings, searchUsers, type SellerSettings } from './actions';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';
import { Label } from '@/components/ui/label';


const sellerSettingsSchema = z.object({
  mode: z.enum(['admins_only', 'all_users', 'specific_users']),
  allowed_sellers: z.record(z.boolean()),
});

type FormValues = z.infer<typeof sellerSettingsSchema>;

interface SellerSettingsFormProps {
    initialSettings: SellerSettings;
    initialAllowedUsers: AppUser[];
}

export function SellerSettingsForm({ initialSettings, initialAllowedUsers }: SellerSettingsFormProps) {
  const [isSaving, startTransitionSaving] = useTransition();
  const [isSearching, startTransitionSearching] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AppUser[]>([]);
  const [allowedUsers, setAllowedUsers] = useState<AppUser[]>(initialAllowedUsers);
  const { toast } = useToast();
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const form = useForm<FormValues>({
    resolver: zodResolver(sellerSettingsSchema),
    defaultValues: {
        mode: initialSettings.mode || 'admins_only',
        allowed_sellers: initialSettings.allowed_sellers || {},
    },
  });

  const watchMode = form.watch('mode');

  useEffect(() => {
    if (debouncedSearchQuery.length > 2) {
        startTransitionSearching(async () => {
            const results = await searchUsers(debouncedSearchQuery);
            // Filter out users who are already in the allowed list
            const newResults = results.filter(
                res => !allowedUsers.some(au => au.id === res.id)
            );
            setSearchResults(newResults);
        });
    } else {
        setSearchResults([]);
    }
  }, [debouncedSearchQuery, allowedUsers]);


  const addSeller = (user: AppUser) => {
    // Add to UI list
    setAllowedUsers(prev => [...prev, user]);
    // Add to form state
    const currentSellers = form.getValues('allowed_sellers');
    form.setValue('allowed_sellers', { ...currentSellers, [user.id]: true });
    // Remove from search results
    setSearchResults(prev => prev.filter(res => res.id !== user.id));
  };
  
  const removeSeller = (userId: string) => {
    // Remove from UI list
    setAllowedUsers(prev => prev.filter(u => u.id !== userId));
    // Remove from form state
    const currentSellers = form.getValues('allowed_sellers');
    const { [userId]: _, ...newSellers } = currentSellers;
    form.setValue('allowed_sellers', newSellers);
  };
  
  const onSubmit = async (data: FormValues) => {
    startTransitionSaving(async () => {
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
                      <UserCheck className="mb-3 h-6 w-6" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Search to Add Sellers</CardTitle>
                    <CardDescription>Find users by name or email to add them to the approved list.</CardDescription>
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
                         {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
                    </div>
                     <div className="space-y-2">
                        {searchResults.map(user => (
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
                                <Button size="sm" variant="outline" onClick={() => addSeller(user)}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add
                                </Button>
                            </div>
                        ))}
                         {debouncedSearchQuery.length > 2 && !isSearching && searchResults.length === 0 && (
                            <p className="p-4 text-center text-sm text-muted-foreground">No matching users found.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Approved Sellers ({allowedUsers.length})</CardTitle>
                    <CardDescription>These users have permission to sell on the marketplace.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {allowedUsers.map(user => (
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
                                <Button size="sm" variant="destructive" onClick={() => removeSeller(user.id)}>
                                    <UserX className="mr-2 h-4 w-4" /> Remove
                                </Button>
                            </div>
                        ))}
                        {allowedUsers.length === 0 && (
                             <p className="p-4 text-center text-sm text-muted-foreground">No users have been specifically approved.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
          </div>
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

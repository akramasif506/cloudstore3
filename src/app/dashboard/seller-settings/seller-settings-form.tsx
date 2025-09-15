
"use client";

import { useState, useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
  FormDescription,
} from '@/components/ui/form';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Info, Users, Shield, User, Trash2, UserPlus } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User as AppUser } from '@/lib/types';
import { setSellerSettings, type SellerSettings, type SellerMode } from './actions';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';

const sellerSettingsSchema = z.object({
  mode: z.enum(['admins_only', 'all_users', 'specific_users']),
  allowed_sellers: z.record(z.boolean()),
});

type FormValues = z.infer<typeof sellerSettingsSchema>;

interface SellerSettingsFormProps {
    initialSettings: SellerSettings;
    searchUsersAction: (query: string) => Promise<AppUser[]>;
}

export function SellerSettingsForm({ initialSettings, searchUsersAction }: SellerSettingsFormProps) {
  const [isSaving, startTransition] = useTransition();
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<AppUser[]>([]);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(sellerSettingsSchema),
    defaultValues: {
        mode: initialSettings.mode || 'admins_only',
        allowed_sellers: initialSettings.allowed_sellers || {},
    },
  });

  const watchMode = form.watch('mode');

  const handleSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const results = await searchUsersAction(query);
    setSearchResults(results);
    setIsSearching(false);
  };

  const addSeller = (user: AppUser) => {
    const currentSellers = form.getValues('allowed_sellers');
    if (!currentSellers[user.id]) {
      form.setValue('allowed_sellers', { ...currentSellers, [user.id]: true });
    }
  };

  const removeSeller = (userId: string) => {
    const currentSellers = form.getValues('allowed_sellers');
    const { [userId]: _, ...newSellers } = currentSellers;
    form.setValue('allowed_sellers', newSellers);
  };

  const allowedSellerIds = Object.keys(form.getValues('allowed_sellers'));
  const approvedSellers = searchResults.filter(user => allowedSellerIds.includes(user.id));
  
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
              <CardDescription>Search for users by name or email and add them to the list of approved sellers.</CardDescription>
            </CardHeader>
            <CardContent>
              <Command className="rounded-lg border shadow-md">
                <CommandInput 
                    placeholder="Type a name or email to search..." 
                    onValueChange={handleSearch}
                />
                <CommandList>
                    {isSearching && <CommandEmpty>Searching...</CommandEmpty>}
                    <CommandGroup heading="Search Results">
                        {searchResults.map((user) => (
                        <CommandItem key={user.id} onSelect={() => addSeller(user)} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.profileImageUrl} />
                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p>{user.name}</p>
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm"><UserPlus className="mr-2 h-4 w-4"/>Add</Button>
                        </CommandItem>
                        ))}
                    </CommandGroup>
                </CommandList>
              </Command>

              <div className="mt-6">
                <h4 className="font-medium mb-2">Approved Sellers ({allowedSellerIds.length})</h4>
                 <ScrollArea className="h-72 w-full rounded-md border">
                    <div className="p-4 space-y-2">
                    {allowedSellerIds.length > 0 ? (
                        allowedSellerIds.map(id => {
                            const user = approvedSellers.find(u => u.id === id);
                            return user ? (
                            <div key={id} className="flex items-center justify-between p-2 rounded-md bg-muted">
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user.profileImageUrl} />
                                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium">{user.name}</p>
                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeSeller(id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                           ) : <div key={id} className="p-2 text-sm text-muted-foreground">Loading user {id}...</div>
                        })
                    ) : (
                        <p className="p-4 text-center text-sm text-muted-foreground">No sellers approved yet.</p>
                    )}
                    </div>
                </ScrollArea>
              </div>
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

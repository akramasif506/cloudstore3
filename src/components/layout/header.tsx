
"use client";

import Link from 'next/link';
import { Leaf, Search, User, LogOut, LayoutDashboard, DollarSign, Package, LogIn, UserPlus, ShoppingCart, FilePlus2, Settings, ShoppingBag, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/auth-context';
import { useCart } from '@/context/cart-context';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function Header() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');


  const getFirstName = (fullName: string | undefined | null): string => {
    if (!fullName) return '';
    return fullName.split(' ')[0];
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const params = new URLSearchParams(searchParams.toString());
      if (searchQuery) {
        params.set('q', searchQuery);
      } else {
        params.delete('q');
      }
      router.push(`/?${params.toString()}`);
    }
  };

  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="flex items-center space-x-2 mr-6">
          <Leaf className="h-6 w-6 text-primary" />
          <div>
            <span className="font-bold font-headline text-lg">CloudStore</span>
            <p className="text-xs text-muted-foreground -mt-1">A Akram Product</p>
          </div>
        </Link>

        <div className="flex flex-1 items-center space-x-2 md:space-x-6">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                type="search"
                placeholder="Search for items..."
                className="pl-9 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                />
            </div>
            
            <nav className="hidden md:flex items-center space-x-4 text-sm font-medium">
                <Link href="/" className="transition-colors hover:text-foreground/80 text-foreground">
                    Home
                </Link>
                <Link href="/listings/new" className="transition-colors hover:text-foreground/80 text-foreground">
                    Sell
                </Link>
            </nav>
        </div>


        <div className="flex items-center justify-end space-x-2 md:space-x-4 ml-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/cart" className="relative">
              <ShoppingCart />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {cartItemCount}
                </span>
              )}
              <span className="sr-only">Shopping Cart</span>
            </Link>
          </Button>

          {user ? (
            <div className="flex items-center gap-4">
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                        <AvatarImage src={user.profileImageUrl} alt={user.name || 'User Avatar'} data-ai-hint="profile picture" />
                        <AvatarFallback>{user.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">Hello, {getFirstName(user.name)}!</p>
                        <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                        </p>
                    </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {user.role === 'admin' && (
                    <>
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</Link>
                        </DropdownMenuItem>
                         <DropdownMenuItem asChild>
                            <Link href="/dashboard/manage-orders"><ShoppingBag className="mr-2 h-4 w-4" />Manage Orders</Link>
                        </DropdownMenuItem>
                         <DropdownMenuItem asChild>
                            <Link href="/dashboard/send-notification"><MessageSquare className="mr-2 h-4 w-4" />Send Notification</Link>
                        </DropdownMenuItem>
                    </>
                    )}
                    <DropdownMenuItem asChild>
                    <Link href="/profile"><User className="mr-2 h-4 w-4" />Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                    <Link href="/my-listings"><Package className="mr-2 h-4 w-4" />My Listings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                    <Link href="/my-orders"><DollarSign className="mr-2 h-4 w-4" />My Orders</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
                <Button asChild variant="ghost">
                    <Link href="/login">
                        <LogIn className="mr-2 h-4 w-4" />
                        Login
                    </Link>
                </Button>
                <Button asChild>
                    <Link href="/register">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Register
                    </Link>
                </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

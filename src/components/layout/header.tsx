
"use client";

import Link from 'next/link';
import { User, LogOut, LayoutDashboard, DollarSign, Package, LogIn, UserPlus, ShoppingCart, FilePlus2, Settings, ShoppingBag, MessageSquare, Menu, Home, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export function Header() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const router = useRouter();


  const getFirstName = (fullName: string | undefined | null): string => {
    if (!fullName) return '';
    return fullName.split(' ')[0];
  };

  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-20 items-center">
        <div className="mr-4 md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48" align="start">
              <DropdownMenuItem asChild>
                <Link href="/"><Home className="mr-2 h-4 w-4" />Home</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/listings/new"><Tag className="mr-2 h-4 w-4" />Sell</Link>
              </DropdownMenuItem>
               <DropdownMenuItem asChild>
                <Link href="/about"><MessageSquare className="mr-2 h-4 w-4" />About</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {!user && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/login"><LogIn className="mr-2 h-4 w-4" />Login</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/register"><UserPlus className="mr-2 h-4 w-4" />Register</Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <Link href="/" className="mr-6">
          <div>
            <Image src={`/logo.png?v=${new Date().getTime()}`} alt="CloudStore Logo" width={120} height={30} className="object-contain" />
            <p className="text-xs text-muted-foreground mt-1">A Akram Product</p>
          </div>
        </Link>

        <div className="flex flex-1 items-center space-x-2 md:space-x-6">
            <nav className="hidden md:flex items-center space-x-4 text-sm font-medium">
                <Link href="/" className="transition-colors hover:text-foreground/80 text-foreground">
                    Home
                </Link>
                 <Link href="/listings/new" className="transition-colors hover:text-foreground/80 text-foreground/60">
                    Sell
                </Link>
                <Link href="/about" className="transition-colors hover:text-foreground/80 text-foreground/60">
                    About
                </Link>
            </nav>
        </div>


        <div className="flex items-center justify-end space-x-2 md:space-x-4 ml-auto">
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
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />Admin Dashboard</Link>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                    <Link href="/profile"><User className="mr-2 h-4 w-4" />Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                    <Link href="/my-listings"><Package className="mr-2 h-4 w-4" />My Listings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                    <Link href="/my-orders"><ShoppingBag className="mr-2 h-4 w-4" />My Orders</Link>
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
            <div className="hidden md:flex items-center gap-2">
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

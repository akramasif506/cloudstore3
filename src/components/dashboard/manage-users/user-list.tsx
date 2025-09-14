"use client";

import { useState } from 'react';
import type { User } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Loader2, Search, Shield, User as UserIcon, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateUserRole, getAllUsers } from '@/app/dashboard/manage-users/actions';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Input } from '@/components/ui/input';

interface UserListProps {
  initialUsers: User[];
}

export function UserList({ initialUsers }: UserListProps) {
  const [users, setUsers] = useState(initialUsers);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const { toast } = useToast();

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    setUpdatingId(userId);
    const result = await updateUserRole(userId, newRole);
    if (result.success) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast({ title: "Role Updated", description: result.message });
    } else {
      toast({ variant: 'destructive', title: "Update Failed", description: result.message });
    }
    setUpdatingId(null);
  }
  
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const params = new URLSearchParams(searchParams.toString());
      if (searchQuery) {
          params.set('q', searchQuery);
      } else {
          params.delete('q');
      }
      router.push(`${pathname}?${params.toString()}`);
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
        const currentQuery = searchParams.get('q');
        const freshUsers = await getAllUsers(currentQuery || undefined);
        setUsers(freshUsers);
        toast({
            title: "Users Refreshed",
            description: "The user list has been updated."
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Refresh Failed",
            description: "Could not fetch the latest user data."
        });
    } finally {
        setIsRefreshing(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <form onSubmit={handleSearch} className="relative flex-grow max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Search by name, email, or contact..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </form>
        <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="sr-only">Refresh Users</span>
        </Button>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user.profileImageUrl} alt={user.name} />
                      <AvatarFallback>{user.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{user.mobileNumber}</TableCell>
                <TableCell>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className={user.role === 'admin' ? 'bg-primary/80' : ''}>
                    {user.role === 'admin' ? (
                        <Shield className="mr-1 h-3.5 w-3.5" />
                    ) : (
                        <UserIcon className="mr-1 h-3.5 w-3.5" />
                    )}
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  {updatingId === user.id ? (
                    <Loader2 className="h-5 w-5 animate-spin ml-auto" />
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">User Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleRoleChange(user.id, 'user')}
                          disabled={user.role === 'user'}
                        >
                          Make User
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleRoleChange(user.id, 'admin')}
                          disabled={user.role === 'admin'}
                        >
                          Make Admin
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {users.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
                <p>No users found for this search.</p>
            </div>
        )}
      </div>
    </div>
  );
}

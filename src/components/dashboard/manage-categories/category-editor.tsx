
"use client"

import { useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createNewCategory, deleteCategory } from '@/app/dashboard/manage-categories/actions';
import { PlusCircle, Trash2, Loader2 } from 'lucide-react';
import { CategoryForm } from '@/components/dashboard/manage-categories/category-form';
import type { CategoryMap, Category, VariantSetMap } from '@/app/dashboard/manage-categories/actions';
import { cn } from '@/lib/utils';
import cloneDeep from 'lodash/cloneDeep';

interface CategoryEditorProps {
  initialCategories: CategoryMap;
  variantSets: VariantSetMap;
}

export function CategoryEditor({ initialCategories, variantSets }: CategoryEditorProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({ variant: 'destructive', title: 'Category name cannot be empty.' });
      return;
    }
    setIsCreating(true);
    const result = await createNewCategory(newCategoryName);
    setIsCreating(false);

    if (result.success && result.newCategory) {
      const newCategory = result.newCategory;
      setCategories(prev => ({ ...prev, [newCategory.id]: newCategory }));
      setSelectedCategoryId(newCategory.id);
      setNewCategoryName('');
      setIsCreateDialogOpen(false);
      toast({ title: 'Success!', description: `Category "${newCategory.name}" created.` });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategoryId) return;
    
    setIsDeleting(true);
    const result = await deleteCategory(selectedCategoryId);
    setIsDeleting(false);

    if (result.success) {
      setCategories(prev => {
        const newCategories = { ...prev };
        delete newCategories[selectedCategoryId];
        return newCategories;
      });
      setSelectedCategoryId(null);
      toast({ title: 'Success!', description: 'Category has been deleted.' });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
  };

  const handleSave = (updatedCategory: Category) => {
    setCategories(prev => ({ ...prev, [updatedCategory.id]: updatedCategory }));
  };
  
  const selectedCategory = selectedCategoryId ? categories[selectedCategoryId] : null;
  const categoryList = Object.values(categories).sort((a,b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-grow">
          <Label htmlFor="category-select">Select a category to edit</Label>
          <Select
            value={selectedCategoryId || ''}
            onValueChange={setSelectedCategoryId}
          >
            <SelectTrigger id="category-select">
              <SelectValue placeholder="Select a category..." />
            </SelectTrigger>
            <SelectContent>
              {categoryList.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end gap-2">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                        <PlusCircle className="mr-2 h-4 w-4" /> Create New
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                    <DialogTitle>Create New Category</DialogTitle>
                    <DialogDescription>Enter a name for the new category.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="new-category-name" className="text-right">Name</Label>
                            <Input
                            id="new-category-name"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="col-span-3"
                            placeholder="e.g., Books"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleCreateCategory} disabled={isCreating}>
                            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            {selectedCategory && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button variant="destructive" disabled={isDeleting}>
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Delete
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete the "{selectedCategory.name}" category. This action cannot be undone and may affect products in this category.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteCategory} disabled={isDeleting} className={cn(buttonVariants({variant: "destructive"}))}>
                                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirm Deletion
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
      </div>
      
      {selectedCategory && (
        <div className="pt-6 border-t">
          <CategoryForm
            category={selectedCategory}
            variantSets={variantSets}
            onSave={handleSave}
            onDelete={handleDeleteCategory}
          />
        </div>
      )}
    </div>
  );
}

import { notFound } from 'next/navigation';
import { mockUsers, mockProducts } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProductGrid } from '@/components/products/product-grid';
import { Separator } from '@/components/ui/separator';

export default function UserProfilePage({ params }: { params: { id: string } }) {
  const user = mockUsers.find((u) => u.id === params.id);
  const userProducts = mockProducts.filter((p) => p.seller.id === params.id);

  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-primary">
              <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="user avatar" />
              <AvatarFallback className="text-3xl">{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-4xl font-headline">{user.name}</CardTitle>
              <p className="text-muted-foreground">Member since 2022</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div>
        <h2 className="text-2xl font-bold font-headline mb-4">Listings from {user.name}</h2>
        <Separator />
        <div className="mt-6">
            {userProducts.length > 0 ? (
                <ProductGrid products={userProducts} />
            ) : (
                <Card className="flex flex-col items-center justify-center text-center py-20">
                    <CardHeader>
                        <CardTitle>No Listings Yet</CardTitle>
                        <CardContent>
                            <p className="text-muted-foreground">{user.name} hasn't listed any items for sale.</p>
                        </CardContent>
                    </CardHeader>
                </Card>
            )}
        </div>
      </div>
    </div>
  );
}

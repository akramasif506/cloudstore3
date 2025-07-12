import type { Product } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { ref, get, query, limitToLast } from 'firebase/database';

async function getRecentProducts(): Promise<Product[]> {
    if (!db) {
        return [];
    }
    try {
        const productsRef = ref(db, 'products');
        const recentProductsQuery = query(productsRef, limitToLast(5));
        const snapshot = await get(recentProductsQuery);
        if (snapshot.exists()) {
            const productsData = snapshot.val();
            const productsList = Object.keys(productsData).map(key => ({
                ...productsData[key],
                id: key,
                price: Number(productsData[key].price) || 0,
            }));
            return productsList.reverse(); // Show newest first
        }
        return [];
    } catch (error) {
        console.error("Error fetching recent products:", error);
        return [];
    }
}

export async function RecentProducts() {
  const products = await getRecentProducts();
  
  if (products.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">No products have been added yet.</p>
  }

  return (
    <div className="space-y-4">
      {products.map((product) => (
        <Link href={`/listings/${product.id}`} key={product.id}>
          <div className="flex items-center gap-4 hover:bg-muted/50 p-2 rounded-lg transition-colors">
            <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                data-ai-hint="product image"
              />
            </div>
            <div className="flex-1">
              <p className="font-semibold truncate">{product.name}</p>
              <p className="text-sm text-muted-foreground">Rs {product.price.toFixed(2)}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

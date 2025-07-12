import { mockUser } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Package, MessageSquare, ShieldAlert } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/stats-card';
import { CategoryChart } from '@/components/dashboard/category-chart';
import { RecentProducts } from '@/components/dashboard/recent-products';
import { RecentMessages } from '@/components/dashboard/recent-messages';
import { db } from '@/lib/firebase';
import { ref, get, query, limitToLast } from 'firebase/database';
import type { ContactMessage, Product } from '@/lib/types';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

async function getRecentMessages(): Promise<ContactMessage[]> {
  if (!db) {
    console.warn("Firebase is not configured. Returning empty messages.");
    return [];
  }
  try {
    const messagesRef = ref(db, 'messages');
    // Fetch the last 10 messages
    const messagesQuery = query(messagesRef, limitToLast(10));
    const snapshot = await get(messagesQuery);
    if (snapshot.exists()) {
      const messagesData = snapshot.val();
      // Convert the object of messages into an array
      return Object.keys(messagesData)
        .map(key => ({ id: key, ...messagesData[key] }))
        .reverse(); // Show newest messages first
    }
    return [];
  } catch (error) {
    console.error("Error fetching messages from Firebase:", error);
    return [];
  }
}

async function getDashboardStats() {
    if (!db) {
        return { totalProducts: 0, totalUsers: 0, totalReviews: 0, chartData: [] };
    }
    try {
        const productsRef = ref(db, 'products');
        const productsSnapshot = await get(productsRef);
        
        let products: Product[] = [];
        if (productsSnapshot.exists()) {
            const productsData = productsSnapshot.val();
            products = Object.keys(productsData).map(key => ({...productsData[key], id: key}));
        }

        const totalProducts = products.length;
        // In a real app, users would be in the database
        const totalUsers = 1; 
        const totalReviews = products.reduce((acc, p) => acc + (p.reviews?.length || 0), 0);

        const productsByCategory = products.reduce((acc, product) => {
            acc[product.category] = (acc[product.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const chartData = Object.entries(productsByCategory).map(([name, products]) => ({ name, products }));

        return { totalProducts, totalUsers, totalReviews, chartData };

    } catch (error) {
        console.error("Error fetching dashboard stats from Firebase:", error);
        return { totalProducts: 0, totalUsers: 0, totalReviews: 0, chartData: [] };
    }
}


export default async function DashboardPage() {
  if (mockUser.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold font-headline">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    )
  }

  const { totalProducts, totalUsers, totalReviews, chartData } = await getDashboardStats();
  const recentMessages = await getRecentMessages();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
        <p className="text-muted-foreground">An overview of your store's activity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard 
          title="Total Products" 
          value={totalProducts} 
          icon={Package} 
        />
        <StatsCard 
          title="Total Users" 
          value={totalUsers} 
          icon={Users} 
        />
        <StatsCard 
          title="Total Reviews" 
          value={totalReviews} 
          icon={MessageSquare} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Products by Category</CardTitle>
          </CardHeader>
          <CardContent>
             {chartData.length > 0 ? <CategoryChart data={chartData} /> : <p className="text-muted-foreground text-center py-10">No product data available for chart.</p>}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Products</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-40 w-full" />}>
                <RecentProducts />
            </Suspense>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Messages</CardTitle>
        </CardHeader>
        <CardContent>
           <Suspense fallback={<Skeleton className="h-24 w-full" />}>
            <RecentMessages messages={recentMessages} />
           </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}


import { mockUser } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Package, MessageSquare, ShieldAlert, CheckCircle, ShoppingCart } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/stats-card';
import { CategoryChart } from '@/components/dashboard/category-chart';
import { RecentProducts } from '@/components/dashboard/recent-products';
import { initializeAdmin } from '@/lib/firebase-admin';
import type { Product, Order } from '@/lib/types';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { RecentOrders } from '@/components/dashboard/recent-orders';


async function getDashboardStats() {
    let db;
    try {
        ({ db } = initializeAdmin());
    } catch (error) {
        console.error("Firebase Admin SDK init error:", error);
        return { totalProducts: 0, pendingProducts: 0, totalUsers: 0, totalOrders: 0, chartData: [] };
    }

    try {
        const productsRef = db.ref('products');
        const productsSnapshot = await productsRef.once('value');
        
        let products: Product[] = [];
        if (productsSnapshot.exists()) {
            const productsData = productsSnapshot.val();
            products = Object.keys(productsData).map(key => ({...productsData[key], id: key}));
        }

        const ordersRef = db.ref('orders');
        const ordersSnapshot = await ordersRef.once('value');
        let orders: Order[] = [];
        if(ordersSnapshot.exists()){
            const ordersData = ordersSnapshot.val();
            orders = Object.keys(ordersData).map(key => ({...ordersData[key], id: key}));
        }


        const totalProducts = products.length;
        const pendingProducts = products.filter(p => p.status === 'pending_review').length;
        // In a real app, users would be in the database
        const totalUsers = 1; 
        const totalOrders = orders.length;

        const productsByCategory = products.reduce((acc, product) => {
            if (product.status === 'active') {
                acc[product.category] = (acc[product.category] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        const chartData = Object.entries(productsByCategory).map(([name, products]) => ({ name, products }));

        return { totalProducts, pendingProducts, totalUsers, totalOrders, chartData };

    } catch (error) {
        console.error("Error fetching dashboard stats from Firebase:", error);
        return { totalProducts: 0, pendingProducts: 0, totalUsers: 0, totalOrders: 0, chartData: [] };
    }
}


export default async function DashboardPage() {
  // For development, we'll check the mock user. 
  // In a real app, you would get the current user's role from your auth context.
  const isAdmin = mockUser.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold font-headline">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    )
  }

  const { totalProducts, pendingProducts, totalUsers, totalOrders, chartData } = await getDashboardStats();
  

  return (
    <div className="space-y-8">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
                <p className="text-muted-foreground">An overview of your store's activity.</p>
            </div>
            <Button asChild>
                <Link href="/dashboard/pending-products">
                    <CheckCircle className="mr-2" />
                    Approve Products
                </Link>
            </Button>
      </div>


      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          title="Total Products" 
          value={totalProducts} 
          icon={Package} 
        />
        <StatsCard 
          title="Pending Approval" 
          value={pendingProducts} 
          icon={CheckCircle}
          className={pendingProducts > 0 ? "border-amber-500 text-amber-600" : ""}
        />
        <StatsCard 
          title="Total Users" 
          value={totalUsers} 
          icon={Users} 
        />
        <StatsCard 
          title="Total Orders" 
          value={totalOrders} 
          icon={ShoppingCart} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Products by Category</CardTitle>
          </CardHeader>
          <CardContent>
             {chartData.length > 0 ? <CategoryChart data={chartData} /> : <p className="text-muted-foreground text-center py-10">No active product data available for chart.</p>}
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
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
           <Suspense fallback={<Skeleton className="h-24 w-full" />}>
            <RecentOrders />
           </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

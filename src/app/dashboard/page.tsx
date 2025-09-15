
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Package, ShieldAlert, CheckCircle, ShoppingCart, List, MessageSquare, Star, BookUser, Megaphone, Percent, Truck, FolderKanban, Undo2, DatabaseZap, Image as ImageIcon, Palette, Wrench, MapPin, Store } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/stats-card';
import { CategoryChart } from '@/components/dashboard/category-chart';
import { RecentProducts } from '@/components/dashboard/recent-products';
import { initializeAdmin } from '@/lib/firebase-admin';
import type { Product, Order, ContactMessage, User } from '@/lib/types';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { RecentOrders } from '@/components/dashboard/recent-orders';
import { RecentReturns } from '@/components/dashboard/recent-returns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Or 'no-store'

async function getDashboardStats() {
    const { db } = initializeAdmin();

    try {
        const productsRef = db.ref('products');
        const productsSnapshot = await productsRef.once('value');
        
        let products: Product[] = [];
        if (productsSnapshot.exists()) {
            const productsData = productsSnapshot.val();
            products = Object.keys(productsData).map(key => ({...productsData[key], id: key}));
        }
        
        const ordersRef = db.ref('all_orders');
        const ordersSnapshot = await ordersRef.once('value');
        let openOrders = 0;
        if(ordersSnapshot.exists()){
            const ordersData = ordersSnapshot.val();
            const allOrders: Order[] = Object.values(ordersData);
            openOrders = allOrders.filter(o => o.status === 'Pending' || o.status === 'Shipped').length;
        }

        const messagesRef = db.ref('messages');
        const messagesSnapshot = await messagesRef.once('value');
        let totalMessages = 0;
        if (messagesSnapshot.exists()) {
            totalMessages = messagesSnapshot.numChildren();
        }

        const usersRef = db.ref('users');
        const usersSnapshot = await usersRef.once('value');
        let totalUsers = 0;
        if (usersSnapshot.exists()) {
            totalUsers = usersSnapshot.numChildren();
        }

        const totalProducts = products.length;
        const pendingProducts = products.filter(p => p.status === 'pending_review').length;
        const activeProducts = products.filter(p => p.status === 'active').length;
        

        const productsByCategory = products.reduce((acc, product) => {
            if (product.status === 'active') {
                acc[product.category] = (acc[product.category] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        const chartData = Object.entries(productsByCategory).map(([name, products]) => ({ name, products }));

        return { totalProducts, activeProducts, pendingProducts, totalUsers, openOrders, totalMessages, chartData };

    } catch (error) {
        console.error("Error fetching dashboard stats from Firebase:", error);
        return { totalProducts: 0, activeProducts: 0, pendingProducts: 0, totalUsers: 0, openOrders: 0, totalMessages: 0, chartData: [] };
    }
}


export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const { totalProducts, activeProducts, pendingProducts, totalUsers, openOrders, totalMessages, chartData } = stats;
  
  return (
    <div className="space-y-8">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
                <p className="text-muted-foreground">An overview of your store's activity.</p>
            </div>
            <Button asChild>
                <Link href="/listings/new">
                    <Package className="mr-2" />
                    Add New Product
                </Link>
            </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
            <CardHeader><CardTitle>Store Vitals</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                 <StatsCard 
                    title="Active Products" 
                    value={activeProducts} 
                    icon={List}
                    href="/dashboard/manage-products"
                    />
                <StatsCard 
                    title="Open Orders" 
                    value={openOrders} 
                    icon={Truck} 
                    href="/dashboard/manage-orders"
                    />
                <StatsCard 
                    title="Pending Approval" 
                    value={pendingProducts} 
                    icon={CheckCircle}
                    className={pendingProducts > 0 ? "border-amber-500 text-amber-600" : ""}
                    href="/dashboard/pending-products"
                    />
                 <StatsCard 
                    title="Messages" 
                    value={totalMessages} 
                    icon={MessageSquare}
                    href="/dashboard/manage-messages"
                    />
                 <StatsCard 
                    title="Total Products" 
                    value={totalProducts} 
                    icon={Package}
                    href="/dashboard/manage-products"
                    />
                <StatsCard 
                    title="Users" 
                    value={totalUsers} 
                    icon={Users}
                    href="/dashboard/manage-users"
                    />
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>Site Management</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                 <StatsCard 
                    title="Promo Banner"
                    value={"Manage"}
                    icon={ImageIcon}
                    href="/dashboard/manage-promo-banner"
                />
                <StatsCard 
                    title="Featured Product" 
                    value={"Manage"} 
                    icon={Star}
                    href="/dashboard/manage-featured-product"
                    />
                <StatsCard 
                    title="About Page" 
                    value={"Edit"} 
                    icon={BookUser}
                    href="/dashboard/manage-about-page"
                    />
                <StatsCard 
                    title="Broadcast" 
                    value={"Set Message"} 
                    icon={Megaphone}
                    href="/dashboard/broadcast-message"
                    />
                <StatsCard 
                    title="Fees & Taxes"
                    value={"Set Rates"}
                    icon={Percent}
                    href="/dashboard/manage-fees"
                />
                 <StatsCard 
                    title="Location Discounts"
                    value={"PIN Codes"}
                    icon={MapPin}
                    href="/dashboard/manage-discounts"
                />
                 <StatsCard 
                    title="Categories"
                    value={"Manage"}
                    icon={FolderKanban}
                    href="/dashboard/manage-categories"
                />
                 <StatsCard 
                    title="Manage Variants"
                    value={"Sizes, Colors"}
                    icon={Palette}
                    href="/dashboard/manage-variants"
                />
                <StatsCard 
                    title="Manage Conditions"
                    value={"New, Used"}
                    icon={Wrench}
                    href="/dashboard/manage-product-conditions"
                />
                 <StatsCard 
                    title="Return Policy"
                    value={"Set Terms"}
                    icon={Undo2}
                    href="/dashboard/manage-returns"
                />
                 <StatsCard 
                    title="Seller Settings"
                    value={"Permissions"}
                    icon={Store}
                    href="/dashboard/seller-settings"
                />
                  <StatsCard 
                    title="Manage Users"
                    value={"View All"}
                    icon={Users}
                    href="/dashboard/manage-users"
                />
            </CardContent>
        </Card>
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
      
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Orders</CardTitle>
                <Button asChild variant="outline">
                    <Link href="/dashboard/manage-orders">View All Orders</Link>
                </Button>
                </CardHeader>
                <CardContent>
                <Suspense fallback={<Skeleton className="h-24 w-full" />}>
                    <RecentOrders />
                </Suspense>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Pending Return Requests</CardTitle>
                <Button asChild variant="outline">
                    <Link href="/dashboard/manage-returns">Manage All</Link>
                </Button>
                </CardHeader>
                <CardContent>
                <Suspense fallback={<Skeleton className="h-24 w-full" />}>
                    <RecentReturns />
                </Suspense>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}

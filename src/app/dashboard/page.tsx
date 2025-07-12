import { mockProducts, mockUsers, mockUser } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Package, MessageSquare, ShieldAlert } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/stats-card';
import { CategoryChart } from '@/components/dashboard/category-chart';
import { RecentProducts } from '@/components/dashboard/recent-products';
import { RecentMessages } from '@/components/dashboard/recent-messages';
import { db } from '@/lib/firebase';
import { ref, get, query, limitToLast } from 'firebase/database';
import type { ContactMessage } from '@/lib/types';

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

  const totalProducts = mockProducts.length;
  const totalUsers = mockUsers.length;
  const totalReviews = mockProducts.reduce((acc, p) => acc + p.reviews.length, 0);

  const productsByCategory = mockProducts.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(productsByCategory).map(([name, products]) => ({ name, products }));

  const recentProducts = [...mockProducts].reverse().slice(0, 5);
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
            <CategoryChart data={chartData} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Products</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentProducts products={recentProducts} />
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentMessages messages={recentMessages} />
        </CardContent>
      </Card>
    </div>
  );
}

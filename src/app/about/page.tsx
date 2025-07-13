
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, Users, Recycle } from 'lucide-react';
import Image from 'next/image';
import { initializeAdmin } from '@/lib/firebase-admin';

const ABOUT_PAGE_PATH = 'site_config/about_page';

interface AboutPageContent {
  title: string;
  description: string;
  imageUrl: string;
  mainContent: string;
}

async function getAboutPageContent(): Promise<AboutPageContent | null> {
    try {
        const { db } = initializeAdmin();
        const ref = db.ref(ABOUT_PAGE_PATH);
        const snapshot = await ref.once('value');
        if (snapshot.exists()) {
            return snapshot.val();
        }
        return null;
    } catch (error) {
        console.error("Error fetching about page content:", error);
        return null;
    }
}

export default async function AboutPage() {
  const customContent = await getAboutPageContent();

  const content = {
      title: customContent?.title || "About CloudStore",
      description: customContent?.description || "Giving pre-loved items a new story.",
      imageUrl: customContent?.imageUrl || "https://placehold.co/1200x400.png",
      mainContent: customContent?.mainContent || `<p>Welcome to CloudStore, your trusted online marketplace for secondhand treasures. We believe that every item has a story and deserves a second chance. Our mission is to create a sustainable and friendly community where people can buy and sell quality pre-owned goods, reducing waste and promoting a more circular economy.</p><p>Founded on the principles of trust, quality, and sustainability, CloudStore provides a seamless and secure platform for you to declutter your life, find unique items, and connect with like-minded individuals. Whether you're searching for vintage furniture, unique home decor, or timeless fashion, you'll find it here.</p>`
  };


  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
                <Leaf className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-4xl font-bold font-headline">{content.title}</CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
                {content.description}
            </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
            <div className="relative w-full aspect-[4/3] md:aspect-[16/6] rounded-lg overflow-hidden mb-8">
                <Image
                    src={content.imageUrl}
                    alt="A vibrant community marketplace"
                    fill
                    className="object-cover"
                    data-ai-hint="community marketplace"
                />
            </div>
            <div 
                className="prose prose-lg dark:prose-invert max-w-none space-y-6 text-lg leading-relaxed"
                dangerouslySetInnerHTML={{ __html: content.mainContent }}
            />

             <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-3">
                        <Recycle className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-xl">Sustainability</h3>
                    <p className="text-muted-foreground mt-1">
                        Promoting a circular economy by extending the life of products.
                    </p>
                </div>
                <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-3">
                        <Users className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-xl">Community</h3>
                    <p className="text-muted-foreground mt-1">
                        Connecting buyers and sellers in a trusted, friendly environment.
                    </p>
                </div>
                 <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-3">
                        <Leaf className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-xl">Quality</h3>
                    <p className="text-muted-foreground mt-1">
                        Ensuring all items are verified for quality and authenticity.
                    </p>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

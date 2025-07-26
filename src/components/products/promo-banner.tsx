
// src/components/products/promo-banner.tsx
import type { PromoBanner as PromoBannerType } from "@/app/dashboard/manage-promo-banner/actions";
import Image from "next/image";
import Link from "next/link";
import { Card } from "../ui/card";

interface PromoBannerProps {
    banner: PromoBannerType;
}

export function PromoBanner({ banner }: PromoBannerProps) {
    const bannerContent = (
         <Card className="overflow-hidden">
            <div className="relative w-full aspect-[16/5]">
                <Image 
                    src={banner.imageUrl} 
                    alt="Promotional Banner"
                    fill
                    className="object-cover"
                    data-ai-hint="advertisement banner"
                />
            </div>
        </Card>
    );

    if (banner.link) {
        return (
            <Link href={banner.link} target="_blank" rel="noopener noreferrer">
                {bannerContent}
            </Link>
        )
    }

    return bannerContent;
}

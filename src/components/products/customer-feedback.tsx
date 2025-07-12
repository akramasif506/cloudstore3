"use client";

import type { Review } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

interface CustomerFeedbackProps {
  reviews: Review[];
}

function StarRating({ rating, className }: { rating: number, className?: string }) {
    return (
        <div className={`flex items-center gap-0.5 ${className}`}>
            {[...Array(5)].map((_, i) => (
                <Star
                key={i}
                className={`h-5 w-5 ${
                    i < rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/50'
                }`}
                />
            ))}
        </div>
    )
}

export function CustomerFeedback({ reviews }: CustomerFeedbackProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold font-headline mb-6">Customer Feedback</h2>
      <div className="space-y-6">
        {reviews.length > 0 ? (
            reviews.map((review, index) => (
                <div key={review.id}>
                    <div className="flex gap-4">
                        <Avatar>
                            <AvatarImage src={review.user.avatarUrl} alt={review.user.name} data-ai-hint="user avatar" />
                            <AvatarFallback>{review.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold">{review.user.name}</p>
                                    <p className="text-sm text-muted-foreground">{review.date}</p>
                                </div>
                                <StarRating rating={review.rating} />
                            </div>
                            <p className="mt-2 text-foreground/90">{review.comment}</p>
                        </div>
                    </div>
                    {index < reviews.length - 1 && <Separator className="mt-6" />}
                </div>
            ))
        ) : (
            <p className="text-muted-foreground">No reviews yet. Be the first to leave one!</p>
        )}
      </div>

      <Separator className="my-8" />

      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquarePlus className="h-6 w-6" />
            <span>Leave a Review</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
            <form className="space-y-4">
                <div>
                    <p className="mb-2 font-medium">Your Rating</p>
                    <StarRating rating={0} className="cursor-pointer" />
                </div>
                <Textarea placeholder="Share your thoughts about this product..." rows={4} />
                <Button className="bg-accent hover:bg-accent/90">Submit Review</Button>
            </form>
        </CardContent>
      </Card>
    </div>
  );
}


"use client";

import type { Review } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MessageSquarePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter, useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { submitReview } from "@/app/listings/[id]/actions";

interface CustomerFeedbackProps {
  reviews: Review[];
}

function StarRating({ rating, setRating, disabled = false }: { rating: number, setRating?: (rating: number) => void, disabled?: boolean }) {
    return (
        <div className={`flex items-center gap-0.5 ${!disabled && 'cursor-pointer'}`}>
            {[...Array(5)].map((_, i) => (
                <Star
                    key={i}
                    className={`h-5 w-5 transition-colors ${
                        i < rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/50 hover:text-amber-300'
                    }`}
                    onClick={() => !disabled && setRating && setRating(i + 1)}
                />
            ))}
        </div>
    )
}

export function CustomerFeedback({ reviews }: CustomerFeedbackProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const productId = params.id as string;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        toast({
            variant: "destructive",
            title: "Not Logged In",
            description: "Please log in to submit a review."
        });
        router.push(`/login?redirect=/listings/${productId}`);
        return;
    }

    if (rating === 0 || comment.length < 10) {
        toast({
            variant: "destructive",
            title: "Incomplete Review",
            description: "Please provide a rating and a comment of at least 10 characters."
        });
        return;
    }

    setIsSubmitting(true);
    const result = await submitReview({ productId, rating, comment });
    setIsSubmitting(false);

    if (result.success) {
        toast({
            title: "Review Submitted!",
            description: result.message
        });
        setRating(0);
        setComment("");
        // The page will be revalidated by the server action, no need to manually refresh
    } else {
        toast({
            variant: "destructive",
            title: "Submission Failed",
            description: result.message
        });
    }
  };

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
                                    <p className="text-sm text-muted-foreground">{new Date(review.date).toLocaleDateString()}</p>
                                </div>
                                <StarRating rating={review.rating} disabled />
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
            <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                    <p className="mb-2 font-medium">Your Rating</p>
                    <StarRating rating={rating} setRating={setRating} />
                </div>
                <Textarea 
                    placeholder="Share your thoughts about this product..." 
                    rows={4} 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    disabled={isSubmitting}
                />
                <Button type="submit" className="bg-accent hover:bg-accent/90" disabled={isSubmitting || !user}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Review
                </Button>
                {!user && <p className="text-sm text-muted-foreground mt-2">You must be logged in to submit a review.</p>}
            </form>
        </CardContent>
      </Card>
    </div>
  );
}

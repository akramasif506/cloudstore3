
import type { ContactMessage } from '@/lib/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Avatar, AvatarFallback } from '../ui/avatar';

interface RecentMessagesProps {
  messages: ContactMessage[];
}

function formatTimestamp(isoString: string) {
    const date = new Date(isoString);
    return date.toLocaleString();
}

export function RecentMessages({ messages }: RecentMessagesProps) {
  if (messages.length === 0) {
    return (
        <div className="text-center text-muted-foreground py-10">
            <p>No messages have been received yet.</p>
        </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {messages.map((message, index) => (
        <AccordionItem value={`item-${index}`} key={message.id}>
          <AccordionTrigger>
            <div className="flex items-center gap-4 w-full pr-4">
                <Avatar className='h-9 w-9'>
                    <AvatarFallback>{message.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className='flex-1 text-left'>
                    <p className="font-semibold">{message.name}</p>
                    <p className="text-sm text-muted-foreground">
                        {message.email}
                        {message.contactNumber && ` • ${message.contactNumber}`}
                    </p>
                </div>
                <p className="text-sm text-muted-foreground ml-auto whitespace-nowrap">
                    {formatTimestamp(message.timestamp)}
                </p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pl-16">
            {message.message}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

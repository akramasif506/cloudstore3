import { ContactForm } from './contact-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-headline">Contact Us</CardTitle>
              <CardDescription>Have questions? We'd love to hear from you.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ContactForm />
        </CardContent>
      </Card>
    </div>
  );
}

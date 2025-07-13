import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-headline">Terms of Service</CardTitle>
              <CardDescription>Last updated: {new Date().toLocaleDateString()}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none space-y-4">
          <h2>1. Introduction</h2>
          <p>
            Welcome to CloudStore! These Terms of Service ("Terms") govern your use of our website, services, and applications (collectively, the "Service"). By accessing or using our Service, you agree to be bound by these Terms.
          </p>

          <h2>2. Use of Our Service</h2>
          <p>
            You must be at least 18 years old to use our Service. You are responsible for any activity that occurs through your account and you agree you will not sell, transfer, license or assign your account, followers, username, or any account rights.
          </p>

          <h2>3. Prohibited Activities</h2>
          <p>
            You agree not to engage in any of the following prohibited activities: (i) copying, distributing, or disclosing any part of the Service in any medium; (ii) using any automated system, including without limitation "robots," "spiders," "offline readers," etc., to access the Service; (iii) transmitting spam, chain letters, or other unsolicited email; (iv) attempting to interfere with, compromise the system integrity or security or decipher any transmissions to or from the servers running the Service.
          </p>

          <h2>4. Listings and Sales</h2>
          <p>
            As a seller, you are responsible for the accuracy and content of the listing and item offered. We reserve the right to remove any listings that violate our policies. As a buyer, you are responsible for reading the full item listing before making a commitment to buy.
          </p>

          <h2>5. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable law, in no event shall CloudStore, its affiliates, agents, directors, employees, suppliers or licensors be liable for any indirect, punitive, incidental, special, consequential or exemplary damages, including without limitation damages for loss of profits, goodwill, use, data or other intangible losses, arising out of or relating to the use of, or inability to use, this service.
          </p>
          
          <h2>6. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will provide notice of any changes by posting the new Terms on this page. Your continued use of the Service after any such change constitutes your acceptance of the new Terms of Service.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

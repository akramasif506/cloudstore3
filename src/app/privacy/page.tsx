import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-headline">Privacy Policy</CardTitle>
              <CardDescription>Last updated: {new Date().toLocaleDateString()}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none space-y-4">
          <h2>1. Information We Collect</h2>
          <p>
            We collect information you provide directly to us, such as when you create an account, create or modify your profile, post listings, make purchases, or otherwise communicate with us. This information may include your name, email, phone number, and payment information.
          </p>

          <h2>2. How We Use Your Information</h2>
          <p>
            We use the information we collect to operate, maintain, and provide you the features and functionality of the Service. This includes processing transactions, communicating with you, and personalizing your experience.
          </p>

          <h2>3. Information Sharing and Disclosure</h2>
          <p>
            We do not sell your personal data. We may share your information with third-party vendors and service providers that perform services on our behalf, such as payment processing and hosting. We may also share information between buyers and sellers to facilitate a transaction.
          </p>

          <h2>4. Your Choices About Your Information</h2>
          <p>
            You may update or correct your account information at any time by logging into your account and visiting your profile page. You can control your communication preferences.
          </p>

          <h2>5. Data Security</h2>
          <p>
            We care about the security of your information and use commercially reasonable safeguards to preserve the integrity and security of all information collected through the Service. However, no security system is impenetrable and we cannot guarantee the security of our systems 100%.
          </p>

          <h2>6. Children's Privacy</h2>
          <p>
            Our Service is not directed to children under 18, and we do not knowingly collect personal information from children under 18. If we learn that we have collected personal information of a child under 18, we will take steps to delete such information from our files as soon as possible.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

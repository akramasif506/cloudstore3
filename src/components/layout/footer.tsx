import Link from "next/link";
import { Leaf } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline text-lg">ReNest</span>
          </div>
          <nav className="flex space-x-6 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground">About</Link>
            <Link href="#" className="hover:text-foreground">Contact Us</Link>
            <Link href="#" className="hover:text-foreground">Terms of Service</Link>
            <Link href="#" className="hover:text-foreground">Privacy Policy</Link>
          </nav>
        </div>
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ReNest. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

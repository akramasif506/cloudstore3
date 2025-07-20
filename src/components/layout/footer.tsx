
import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Image src="/logo.png" alt="CloudStore Logo" width={24} height={24} key={Math.random()} />
            <div>
                <span className="font-bold font-headline text-lg">CloudStore</span>
                <p className="text-xs text-muted-foreground -mt-1">A Akram Product</p>
            </div>
          </div>
          <nav className="flex space-x-6 text-sm text-muted-foreground">
            <Link href="/about" className="hover:text-foreground">About</Link>
            <Link href="/contact" className="hover:text-foreground">Contact Us</Link>
            <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
          </nav>
        </div>
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} CloudStore. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

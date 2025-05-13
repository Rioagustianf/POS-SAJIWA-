import Link from "next/link";
import { Utensils } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-yellow-500 text-[#4A102A] py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Utensils className="h-6 w-6" />
            <h1 className="text-xl font-bold">Sajiwa Steak Restaurant</h1>
          </div>
          <nav>
            <ul className="flex space-x-4">
              <li>
                <Link href="/login" className="hover:underline">
                  Login
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <Utensils className="h-16 w-16 mx-auto mb-4" />
            <h2 className="text-4xl font-bold mb-4">
              Welcome to Sajiwa Steak Restaurant
            </h2>
            <p className="text-xl text-muted-foreground">
              Point of Sale System
            </p>
          </div>

          <div className="grid text-[#4A102A] gap-6 md:grid-cols-2 max-w-2xl mx-auto">
            <div className="bg-card bg-yellow-500 rounded-lg shadow-md p-6 flex flex-col items-center">
              <h3 className="text-xl font-semibold mb-2">Cashier Portal</h3>
              <p className="text-muted-foreground text-center mb-4">
                Access the POS system to process orders and manage sales
              </p>
              <Link
                href="/login?role=cashier"
                className="bg-[#C5172E] text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                Login as Cashier
              </Link>
            </div>

            <div className="bg-card bg-yellow-500 rounded-lg shadow-md p-6 flex flex-col items-center">
              <h3 className="text-xl font-semibold mb-2">Admin Portal</h3>
              <p className="text-muted-foreground text-center mb-4">
                Manage products, view reports, and administer the system
              </p>
              <Link
                href="/login?role=admin"
                className="bg-[#C5172E] text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                Login as Admin
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-muted py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            &copy; {new Date().getFullYear()} Sajiwa Steak Restaurant. All
            rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

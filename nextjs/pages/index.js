import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Header / Navbar */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-bold text-xl text-blue-600">ACP App</div>
          <div className="space-x-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2">
              Log in
            </Link>
            <Link href="/register" className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-24 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">
          ⚡ Commercial-Ready Application Solution
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
          Manage Your Business & Workflow with High Performance
        </h1>
        
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Built with FastAPI, PostgreSQL, and Next.js. Deliver real commercial value with secure role-based access, inventory tracking, and analytics.
        </p>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-20 border-t border-gray-100">
        <div className="container mx-auto px-6 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">Core Features & Architecture</h2>
            <p className="text-gray-500">Designed following software entrepreneur standards and robust business logic.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold">FastAPI & CRUD</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Modular backend routing with PostgreSQL integration for fast and reliable data management.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-xl w-fit">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold">Role-Based Security</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Secure JWT authentication supporting Free, Pro, and Admin user tiers with granular control.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl w-fit">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold">Admin Analytics</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Monitor active users, simulated checkout metrics, and overall system performance in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <p>© 2026 ACP App. Built for Commercial Application Project.</p>
      </footer>
    </div>
  );
}
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Price() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  
const handleSubscribe = async (tier) => {
  if (tier === 'Professional') {
    router.push('/checkout');
    return;
  }

  setLoading(true);

  try {
    alert('You selected the Basic plan.');
    router.push('/hosdash');
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* Header */}
      <div className="text-center pt-16 pb-10 px-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Choose the plan that works for you
        </h1>

        <p className="mt-4 text-gray-500 text-lg">
          Choose a plan for managing your medicine inventory and robotics system.
        </p>
      </div>


      {/* Pricing Cards */}
      <div className="max-w-5xl mx-auto px-6 pb-20">

        <div className="grid md:grid-cols-2 gap-6">


          {/* ==================== BASIC ==================== */}

          <div className="border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition">

            {/* Package Name */}
            <div className="mb-8">

              <h2 className="text-2xl font-semibold">
                Basic
              </h2>

              <p className="text-gray-500 mt-2">
                For users who are getting started
              </p>

            </div>


            {/* Price */}
            <div className="mb-8">

              <span className="text-4xl font-bold">
                ฿0
              </span>

              <span className="text-gray-500 ml-2">
                / month
              </span>

            </div>


            {/* Button */}
            <button
              onClick={() => handleSubscribe('Basic')}
              disabled={loading}
              className="w-full border border-gray-300 py-3 rounded-xl font-medium hover:bg-gray-100 transition disabled:opacity-50"
            >
              {loading
                ? 'Processing...'
                : 'Choose Basic'}
            </button>


            {/* Divider */}
            <div className="border-t border-gray-200 my-8"></div>


            {/* Features */}
            <p className="font-semibold mb-5">
              Features
            </p>


            <ul className="space-y-4 text-gray-700">

              {/* Product */}
              <li className="flex gap-3">
                <span className="text-green-600">
                  ✓
                </span>

                <span>
                  Up to 500 products
                </span>
              </li>


              {/* Inventory */}
              <li className="flex gap-3">
                <span className="text-green-600">
                  ✓
                </span>

                <span>
                  Basic Inventory Management
                </span>
              </li>


              {/* Single Warehouse */}
              <li className="flex gap-3">
                <span className="text-green-600">
                  ✓
                </span>

                <span>
                  Single Warehouse
                  <span className="block text-sm text-gray-500">
                    Manage one warehouse
                  </span>
                </span>
              </li>


              {/* Multiple Warehouses */}
              <li className="flex gap-3">
                <span className="text-gray-400">
                  ✕
                </span>

                <span className="text-gray-400">
                  Multiple Warehouses
                  <span className="block text-sm">
                    Not available
                  </span>
                </span>
              </li>


              {/* Robot */}
              <li className="flex gap-3">
                <span className="text-gray-400">
                  ✕
                </span>

                <span className="text-gray-400">
                  Robot Task Automation
                </span>
              </li>


              {/* Admin */}
              <li className="flex gap-3">
                <span className="text-gray-400">
                  ✕
                </span>

                <span className="text-gray-400">
                  Admin Dashboard
                </span>
              </li>

            </ul>

          </div>



          {/* ==================== PROFESSIONAL ==================== */}

          <div className="relative border-2 border-black rounded-2xl p-8 shadow-md">


            {/* Recommended */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">

              <span className="bg-black text-white px-4 py-1.5 rounded-full text-sm font-medium">
                Recommended
              </span>

            </div>


            {/* Package Name */}
            <div className="mb-8">

              <h2 className="text-2xl font-semibold">
                Professional
              </h2>

              <p className="text-gray-500 mt-2">
                For businesses that need the full system
              </p>

            </div>


            {/* Price */}
            <div className="mb-8">

              <span className="text-4xl font-bold">
                ฿1,990
              </span>

              <span className="text-gray-500 ml-2">
                / month
              </span>

            </div>


            {/* Button */}
            <button
              onClick={() => handleSubscribe('Professional')}
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition disabled:opacity-50"
            >
              {loading
                ? 'Processing...'
                : 'Choose Professional'}
            </button>


            {/* Divider */}
            <div className="border-t border-gray-200 my-8"></div>


            {/* Features */}
            <p className="font-semibold mb-5">
              Features
            </p>


            <ul className="space-y-4 text-gray-700">

              {/* Product */}
              <li className="flex gap-3">
                <span className="text-green-600">
                  ✓
                </span>

                <span>
                  Unlimited products
                </span>
              </li>


              {/* Inventory */}
              <li className="flex gap-3">
                <span className="text-green-600">
                  ✓
                </span>

                <span>
                  Full Inventory Management
                </span>
              </li>


              {/* Single Warehouse */}
              <li className="flex gap-3">
                <span className="text-green-600">
                  ✓
                </span>

                <span>
                  Single Warehouse
                  <span className="block text-sm text-gray-500">
                    Manage one warehouse
                  </span>
                </span>
              </li>


              {/* Multiple Warehouses */}
              <li className="flex gap-3">
                <span className="text-green-600">
                  ✓
                </span>

                <span>
                  Multiple Warehouses
                  <span className="block text-sm text-gray-500">
                    Manage multiple warehouses
                  </span>
                </span>
              </li>


              {/* Admin Dashboard */}
              <li className="flex gap-3">
                <span className="text-green-600">
                  ✓
                </span>

                <span>
                  Admin Dashboard
                </span>
              </li>


              {/* Robot Task */}
              <li className="flex gap-3">
                <span className="text-green-600">
                  ✓
                </span>

                <span>
                  Robot Task Automation
                  <span className="block text-sm text-gray-500">
                    Automated robot-assisted medicine preparation
                  </span>
                </span>
              </li>


              {/* Automation */}
              <li className="flex gap-3">
                <span className="text-green-600">
                  ✓
                </span>

                <span>
                  Automation System
                </span>
              </li>

            </ul>

          </div>

        </div>

      </div>

    </div>
  );
}
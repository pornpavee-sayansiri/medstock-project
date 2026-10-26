import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Profile() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!router.isReady) return;

    const token = sessionStorage.getItem('token');

    if (!token) {
      router.replace('/login');
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await fetch(
          'http://127.0.0.1:8000/api/me',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 401) {
        sessionStorage.removeItem('token');
        router.replace('/login');
        return;
        }

        if (!response.ok) {
          throw new Error('Unable to load account information.');
        }

        const data = await response.json();
        setUser(data);
      } catch (err) {
        setError(err.message || 'Unable to load account information.');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router.isReady]);

  const handleLogout = () => {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('email');
  sessionStorage.removeItem('organizationName');
  sessionStorage.removeItem('role');
  sessionStorage.removeItem('subscription');

  router.push('/login');
};

  const handleManagePlan = () => {
    router.push('/price');
  };

  const plan = user?.subscription || 'Basic';
  const role = user?.role || 'STAFF';
  const organizationName = user?.organization_name || 'Not provided';
  const userEmail = user?.email || '';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Account Settings
          </h1>
          <p className="text-gray-500 mt-2">
            Manage your account and subscription.
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border p-8">
            Loading account information...
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-red-200 p-8 text-red-600">
            {error}
          </div>
        ) : user ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Account header */}
            <div className="bg-black px-8 py-10 text-white">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center text-3xl font-bold">
                  {(organizationName !== 'Not provided'
                    ? organizationName
                    : userEmail
                  ).charAt(0).toUpperCase()}
                </div>

                <div>
                  <h2 className="text-2xl font-semibold">
                    {organizationName}
                  </h2>
                  <p className="text-gray-300 mt-1">{userEmail}</p>
                  <p className="text-gray-400 text-sm mt-2">
                    {role}
                  </p>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="p-8">
              <h3 className="text-lg font-semibold mb-6">
                Account Information
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Organization Name
                  </label>
                  <div className="border border-gray-200 rounded-lg px-4 py-3">
                    {organizationName}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Email Address
                  </label>
                  <div className="border border-gray-200 rounded-lg px-4 py-3 break-all">
                    {userEmail}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Role
                  </label>
                  <div className="border border-gray-200 rounded-lg px-4 py-3">
                    {role}
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription */}
            <div className="border-t border-gray-200 p-8">
              <h3 className="text-lg font-semibold">
                Subscription
              </h3>
              <p className="text-gray-500 text-sm mt-1 mb-6">
                Your current subscription plan.
              </p>

              <div className="border border-gray-200 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                  <div>
                    <h4 className="text-xl font-semibold">
                      {plan}
                    </h4>
                    <p className="text-gray-500 mt-2">
                      {plan.toLowerCase() === 'professional'
                        ? 'Multiple warehouses and Robot Task features.'
                        : 'Basic inventory features.'}
                    </p>
                  </div>

                  <button
                    onClick={handleManagePlan}
                    className="border border-gray-300 px-5 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition"
                  >
                    Manage Plan
                  </button>
                </div>
              </div>
            </div>

            {/* Logout */}
            <div className="border-t border-gray-200 p-8">
              <h3 className="text-lg font-semibold">Login / Logout</h3>
              <p className="text-gray-500 text-sm mt-1 mb-5">
                Sign out from your MedStock account.
              </p>

              <button
                onClick={handleLogout}
                className="bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition"
              >
                Logout
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
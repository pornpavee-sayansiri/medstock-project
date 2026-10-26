
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Checkout() {
  const router = useRouter();

  const [invoiceRequested, setInvoiceRequested] = useState(false);
  const [slip, setSlip] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRequestInvoice = () => {
    setInvoiceRequested(true);
  };

  const handleSubmitPayment = async () => {
    if (!slip) {
      alert('Please upload your payment slip.');
      return;
    }

    const token = sessionStorage.getItem('token');

    if (!token) {
      alert('Please log in again before submitting payment.');
      router.push('/login');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('slip', slip);

      const response = await fetch('http://127.0.0.1:8000/api/payments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        // คำขอเดิมกำลังรอ Admin ตรวจสอบอยู่
        if (response.status === 409) {
          sessionStorage.setItem('paymentStatus', 'pending');
          sessionStorage.setItem('requestedPlan', 'Professional');
          router.push('/payment');
          return;
        }

        throw new Error(data.detail || 'Failed to submit payment.');
      }

      sessionStorage.setItem('paymentStatus', 'pending');
      sessionStorage.setItem('requestedPlan', 'Professional');
      router.push('/payment');
    } catch (error) {
      alert(error.message || 'Unable to submit payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Professional Subscription
          </h1>
          <p className="text-gray-500 mt-2">
            B2B subscription and payment
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* ORDER SUMMARY */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-6">
              Subscription Summary
            </h2>

            <div className="flex justify-between">
              <div>
                <p className="font-semibold text-lg">Professional Plan</p>
                <p className="text-gray-500 text-sm mt-1">
                  For hospitals and corporate clients
                </p>
              </div>
              <p className="font-bold text-lg">฿1,990</p>
            </div>

            <div className="border-t border-gray-200 my-6" />

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Billing cycle</span>
                <span className="font-medium">Monthly</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Subscription type</span>
                <span className="font-medium">B2B</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment method</span>
                <span className="font-medium">Bank Transfer</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-5 mt-6">
              <p className="font-semibold mb-3">Professional Features</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ Unlimited products</li>
                <li>✓ Multiple warehouses</li>
                <li>✓ Robot Task Automation</li>
                <li>✓ Admin Dashboard</li>
              </ul>
            </div>
          </div>

          {/* B2B PAYMENT */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-2">B2B Payment</h2>
            <p className="text-gray-500 text-sm mb-6">
              Hospitals can request an invoice and pay by bank transfer.
            </p>

            {/* STEP 1 */}
            <div className="border border-gray-200 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-semibold">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Request Invoice</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Request an invoice for your hospital or organization.
                  </p>
                  <button
                    onClick={handleRequestInvoice}
                    disabled={invoiceRequested}
                    className="mt-4 bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:bg-green-600"
                  >
                    {invoiceRequested ? 'Invoice Requested ✓' : 'Request Invoice'}
                  </button>
                </div>
              </div>
            </div>

            {/* STEP 2 */}
            <div className="border border-gray-200 rounded-xl p-5 mt-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Bank Transfer</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Transfer the payment to the following bank account.
                  </p>

                  <div className="bg-gray-50 rounded-lg p-4 mt-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Bank</span>
                      <span className="font-medium">MedStock Bank</span>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-gray-500">Account Name</span>
                      <span className="font-medium">MedStock Co., Ltd.</span>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-gray-500">Account Number</span>
                      <span className="font-medium">123-4-56789-0</span>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-gray-500">Amount</span>
                      <span className="font-bold">฿1,990</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 3 */}
            <div className="border border-gray-200 rounded-xl p-5 mt-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-semibold">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Upload Payment Slip</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Upload your bank transfer slip for verification.
                  </p>

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={(e) => setSlip(e.target.files?.[0] || null)}
                    className="mt-4 w-full border border-gray-300 rounded-lg p-3 text-sm"
                  />

                  {slip && (
                    <div className="mt-3 bg-green-50 text-green-700 rounded-lg p-3 text-sm">
                      ✓ Payment slip selected:
                      <span className="font-medium ml-1">{slip.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SUBMIT */}
            <button
              onClick={handleSubmitPayment}
              disabled={loading || !slip}
              className="w-full mt-6 bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading
                ? 'Submitting Payment...'
                : 'Submit Payment for Verification'}
            </button>

            <p className="text-xs text-gray-400 text-center mt-4">
              Your Professional access will be activated after administrator verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

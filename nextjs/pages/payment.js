import { useRouter } from 'next/router';

export default function PaymentPending() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">

      <div className="bg-white border border-gray-200 rounded-2xl p-10 max-w-lg w-full text-center shadow-sm">

        {/* Icon */}

        <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full mx-auto flex items-center justify-center text-3xl">
          !
        </div>


        <h1 className="text-2xl font-bold mt-6">
          Payment Under Verification
        </h1>


        <p className="text-gray-500 mt-3">
          Your payment slip has been submitted successfully.
          Our administrator will verify your payment before
          activating the Professional subscription.
        </p>


        {/* Status */}

        <div className="bg-gray-50 rounded-xl p-5 mt-6 text-left">

          <div className="flex justify-between">

            <span className="text-gray-500">
              Plan
            </span>

            <span className="font-medium">
              Professional
            </span>

          </div>


          <div className="flex justify-between mt-3">

            <span className="text-gray-500">
              Amount
            </span>

            <span className="font-medium">
              ฿1,990
            </span>

          </div>


          <div className="flex justify-between mt-3">

            <span className="text-gray-500">
              Payment Status
            </span>

            <span className="text-yellow-600 font-medium">
              Pending Verification
            </span>

          </div>

        </div>


        {/* Information */}

        <div className="bg-blue-50 text-blue-700 rounded-xl p-4 mt-6 text-sm text-left">

          <p className="font-medium mb-1">
            What happens next?
          </p>

          <p>
            An administrator will review your payment
            and approve the transaction. Once approved,
            your Professional features will be unlocked.
          </p>

        </div>


        <button
          onClick={() => router.push('/products')}
          className="w-full bg-black text-white py-3 rounded-xl mt-6 hover:bg-gray-800"
        >
          Back to Dashboard
        </button>

      </div>

    </div>
  );
}
let API_URL = '';

async function loadEnv() {
  const currentHost = window.location.hostname;

  // If inside WordPress or your production domain
  if (currentHost === 'manongapp.com' || currentHost === 'www.manongapp.com') {
    API_URL = `https://api.manongapp.com/api`;
    console.log('Using API_URL (WordPress):', API_URL);
    return;
  }

  // Otherwise (like local dev or test), try fetching /env
  try {
    const res = await fetch('/env');
    if (!res.ok) throw new Error('No /env found');
    const data = await res.json();
    API_URL = data.API_URL || 'http://localhost:3000/api';
    console.log('Using API_URL (from /env):', API_URL);
  } catch (e) {
    // fallback for local
    API_URL = 'http://localhost:3000/api';
    console.warn('⚠️ Falling back to localhost API:', API_URL, e.message);
  }
}

async function loadPayment() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id'); // serviceRequestId from ?id=xxx

  if (!id) {
    document.getElementById('status-text').textContent = 'Invalid Request';
    document.getElementById('status-description').textContent =
      'Missing service request ID in URL.';
    return;
  }

  if (!TOKEN) {
    document.getElementById('status-text').textContent = 'Invalid Request';
    document.getElementById('status-description').textContent = 'Unauthorized.';
    return;
  }

  try {
    const res = await axios.get(`${API_URL}/service-requests/${id}`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    });
    const data = res.data?.data;

    const payment = data?.paymentTransactions?.[0];
    if (!payment) throw new Error('No payment transaction found');

    // Extract fields
    const amount = payment.amount ?? 0;
    const status = payment.status ?? 'pending';
    const paymentId = payment.paymentIdOnGateway ?? '-';
    // const provider = payment.provider ?? "unknown";
    const paymentIntent = payment.paymentIntentId ?? '';

    // Update UI
    document.getElementById('details-card').classList.remove('hidden');
    document.getElementById('view-button').classList.remove('hidden');

    document.getElementById('amount').textContent = `₱${amount}`;
    document.getElementById('paymentId').textContent = paymentId;
    document.getElementById('status').textContent =
      status.charAt(0).toUpperCase() + status.slice(1);

    const check = document.getElementById('check-container');
    const title = document.getElementById('status-text');
    const desc = document.getElementById('status-description');

    if (status === 'paid' || status === 'succeeded' || status === 'success') {
      check.className =
        'w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-green-100 flex items-center justify-center mb-6 mx-auto';
      title.textContent = 'Payment Successful';
      desc.textContent = 'Your payment has been processed successfully.';
    } else if (status === 'failed') {
      check.className =
        'w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-red-100 flex items-center justify-center mb-6 mx-auto';
      title.textContent = 'Payment Failed';
      desc.textContent = 'Unfortunately, your payment could not be processed.';
    } else {
      check.className =
        'w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-yellow-100 flex items-center justify-center mb-6 mx-auto';
      title.textContent = 'Payment Pending';
      desc.textContent = 'Your payment is being verified. Please wait.';
    }

    document.getElementById('view-button').addEventListener('click', (e) => {
      e.preventDefault();

      const deepLink = `manong_application://payment-complete?payment_intent_id=${encodeURIComponent(paymentIntent)}`;

      // Try to open the app
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = deepLink;
      document.body.appendChild(iframe);

      // Optional fallback alert after 1.5 seconds
      setTimeout(() => {
        alert('If the app didn’t open, please open it manually.');
      }, 1500);
    });
  } catch (err) {
    document.getElementById('status-text').textContent =
      'Error loading payment';
    document.getElementById('status-description').textContent =
      'We couldn’t retrieve your payment details. Please try again.';
    console.error(err);
  }
}
document.addEventListener('DOMContentLoaded', async () => {
  await loadEnv();
  loadPayment();
});

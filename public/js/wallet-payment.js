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

async function loadWalletPayment() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id'); // transactionId from ?id=xxx

  if (!id) {
    document.getElementById('status-text').textContent = 'Invalid Request';
    document.getElementById('status-description').textContent =
      'Missing transaction ID in URL.';
    return;
  }

  if (!TOKEN) {
    document.getElementById('status-text').textContent = 'Invalid Request';
    document.getElementById('status-description').textContent = 'Unauthorized.';
    return;
  }

  try {
    const res = await axios.get(
      `${API_URL}/manong-wallet-transaction/${id}/details`,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
        },
      }
    );
    const data = res.data?.data;

    if (!data) throw new Error('No wallet transaction found');

    // Extract fields
    const amount = data?.amount ?? 0;
    const status = data?.status ?? 'pending';
    const transactionType = data?.type ?? 'topup';
    const transactionId = data?.id ?? '-';
    
    // Parse metadata if available
    let metadata = {};
    if (data?.metadata) {
      try {
        metadata = JSON.parse(data.metadata);
      } catch (e) {
        console.warn('Failed to parse metadata:', e);
      }
    }
    
    const paymentIdOnGateway = metadata?.paymentIdOnGateway ?? '-';

    // Update UI
    document.getElementById('details-card').classList.remove('hidden');
    document.getElementById('view-button').classList.remove('hidden');

    document.getElementById('amount').textContent = `₱${amount}`;
    document.getElementById('transactionId').textContent = transactionId;
    document.getElementById('type').textContent = 
      transactionType.charAt(0).toUpperCase() + transactionType.slice(1);
    document.getElementById('status').textContent =
      status.charAt(0).toUpperCase() + status.slice(1);

    const check = document.getElementById('check-container');
    const title = document.getElementById('status-text');
    const desc = document.getElementById('status-description');

    if (status === 'completed' || status === 'paid' || status === 'succeeded') {
      check.className =
        'w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-green-100 flex items-center justify-center mb-6 mx-auto';
      title.textContent = 'Top-up Successful';
      desc.textContent = 'Your wallet has been topped up successfully.';
    } else if (status === 'failed') {
      check.className =
        'w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-red-100 flex items-center justify-center mb-6 mx-auto';
      title.textContent = 'Top-up Failed';
      desc.textContent = 'Unfortunately, your top-up could not be processed.';
    } else {
      check.className =
        'w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-yellow-100 flex items-center justify-center mb-6 mx-auto';
      title.textContent = 'Top-up Pending';
      desc.textContent = 'Your transaction is being verified. Please wait.';
    }

    // Create open app button
    const viewButton = document.getElementById('view-button');
    viewButton.addEventListener('click', (e) => {
      e.preventDefault();

      // Use the same payment intent ID logic as service request
      const paymentIntentId = params.get('payment_intent_id') || metadata?.paymentIntentId;
      if (paymentIntentId) {
        const deepLink = `manong_application://wallet-payment-complete?payment_intent_id=${encodeURIComponent(paymentIntentId)}`;

        // Try to open the app
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = deepLink;
        document.body.appendChild(iframe);

        // Optional fallback alert after 1.5 seconds
        setTimeout(() => {
          alert('If the app didn\'t open, please open it manually.');
        }, 1500);
      } else {
        // Fallback: just show an alert
        alert('Top-up completed. Please check your wallet in the app.');
      }
    });

  } catch (err) {
    console.error('Error loading wallet payment:', err);
    document.getElementById('status-text').textContent =
      'Error loading transaction';
    document.getElementById('status-description').textContent =
      'We couldn\'t retrieve your transaction details. Please try again.';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadEnv();
  loadWalletPayment();
});
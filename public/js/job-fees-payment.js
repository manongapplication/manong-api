let API_URL = '';

async function loadEnv() {
  const currentHost = window.location.hostname;

  if (currentHost === 'manongapp.com' || currentHost === 'www.manongapp.com') {
    API_URL = `https://api.manongapp.com/api`;
    return;
  }

  try {
    const res = await fetch('/env');
    if (!res.ok) throw new Error('No /env found');
    const data = await res.json();
    API_URL = data.API_URL || 'http://localhost:3000/api';
  } catch (e) {
    API_URL = 'http://localhost:3000/api';
    console.warn('Falling back to localhost API:', e.message);
  }
}

async function loadJobFeesPayment() {
  const params = new URLSearchParams(window.location.search);
  const idsParam = params.get('ids'); // Could be dash-separated or comma-separated
  const paymentIntentId = params.get('payment_intent_id');

  console.log('Raw IDs from URL:', idsParam);
  console.log('Payment Intent ID:', paymentIntentId);

  if (!idsParam) {
    document.getElementById('status-text').textContent = 'Invalid Request';
    document.getElementById('status-description').textContent = 'Missing job fees IDs.';
    return;
  }

  if (!window.TOKEN) {
    document.getElementById('status-text').textContent = 'Unauthorized';
    document.getElementById('status-description').textContent = 'No auth token provided.';
    return;
  }

  try {
    // Convert dash-separated IDs to array of numbers
    let idsArray;
    if (idsParam.includes('-')) {
      // Handle dash-separated format (7-8-12-14)
      idsArray = idsParam.split('-').map(id => parseInt(id.trim()));
    } else {
      // Handle comma-separated format (7,8,12,14)
      idsArray = idsParam.split(',').map(id => parseInt(id.trim()));
    }
    
    // Filter out any NaN values
    idsArray = idsArray.filter(id => !isNaN(id));
    
    console.log('Parsed IDs array:', idsArray);

    // Make the API call with proper JSON body
    const res = await axios.post(
      `${API_URL}/manong-wallet-transaction/job-fees/payment-status`,
      { ids: idsArray }, // Send as array of numbers
      { 
        headers: { 
          'Authorization': `Bearer ${window.TOKEN}`,
          'Content-Type': 'application/json'
        } 
      }
    );

    console.log('API Response:', res.data);

    const data = res.data;
    if (!data) throw new Error('No job fees found');

    const totalAmount = data.totalAmount ?? 0;
    const transactionIds = data.completedIds?.join(', ') ?? '-';
    const status = data.status ?? 'pending';

    document.getElementById('details-card').classList.remove('hidden');
    document.getElementById('view-button').classList.remove('hidden');

    document.getElementById('amount').textContent = `₱${totalAmount.toFixed(2)}`;
    document.getElementById('transactionIds').textContent = transactionIds;
    document.getElementById('status').textContent = status.charAt(0).toUpperCase() + status.slice(1);

    const check = document.getElementById('check-container');
    const title = document.getElementById('status-text');
    const desc = document.getElementById('status-description');

    if (status === 'completed' || status === 'paid' || status === 'succeeded') {
      check.className = 'w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-green-100 flex items-center justify-center mb-6 mx-auto';
      title.textContent = 'Payment Successful';
      desc.textContent = 'Your job fees payment has been completed.';
    } else if (status === 'failed') {
      check.className = 'w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-red-100 flex items-center justify-center mb-6 mx-auto';
      title.textContent = 'Payment Failed';
      desc.textContent = 'Your job fees payment could not be processed.';
    } else {
      check.className = 'w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-yellow-100 flex items-center justify-center mb-6 mx-auto';
      title.textContent = 'Payment Pending';
      desc.textContent = 'Your job fees payment is being verified. Please wait.';
    }

    // Remove any existing event listeners by cloning and replacing the button
    const viewButton = document.getElementById('view-button');
    const newViewButton = viewButton.cloneNode(true);
    viewButton.parentNode.replaceChild(newViewButton, viewButton);
    
    newViewButton.addEventListener('click', (e) => {
      e.preventDefault();
      if (paymentIntentId) {
        const deepLink = `manong_application://job-fees-payment-complete?payment_intent_id=${encodeURIComponent(paymentIntentId)}`;
        console.log('Opening deep link:', deepLink);
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = deepLink;
        document.body.appendChild(iframe);
        setTimeout(() => { 
          alert("If the app didn't open automatically, please open it manually."); 
        }, 1500);
      } else {
        alert('Payment completed. Please check the app.');
      }
    });

  } catch (err) {
    console.error('Error loading job fees payment:', err);
    if (err.response) {
      console.error('Error response:', err.response.data);
    }
    document.getElementById('status-text').textContent = 'Error';
    document.getElementById('status-description').textContent = "Couldn't retrieve payment details. Please try again.";
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadEnv();
  loadJobFeesPayment();
});
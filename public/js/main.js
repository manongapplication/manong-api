const MAX_ASSISTANTS = 5;

const iconLibrary = {
  water_drop:
    '<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C10 6 6 10 6 14a6 6 0 0012 0c0-4-4-8-6-12z"/></svg>',
  plumbing: '<i class="fa-solid fa-wrench"></i>',
  wc: '<i class="fa-solid fa-toilet"></i>',
  thermostat: '<i class="fa-solid fa-temperature-half"></i>',
  water_damage: '<i class="fa-solid fa-droplet"></i>',
  tap: '<i class="fa-solid fa-faucet"></i>',
  search: '<i class="fa-solid fa-magnifying-glass"></i>',
  shower: '<i class="fa-solid fa-shower"></i>',
  delete: '<i class="fa-solid fa-trash"></i>',
  power: '<i class="fa-solid fa-power-off"></i>',
  lightbulb: '<i class="fa-solid fa-lightbulb"></i>',
  electrical_services: '<i class="fa-solid fa-bolt"></i>',
  flash_on: '<i class="fa-solid fa-bolt"></i>',
  door_front: '<i class="fa-solid fa-door-closed"></i>',
  shelves: '<i class="fa-solid fa-shelves"></i>',
  chair: '<i class="fa-solid fa-chair"></i>',
  format_shapes: '<i class="fa-solid fa-ruler-combined"></i>',
  handyman: '<i class="fa-solid fa-hammer"></i>',
  door_sliding: '<i class="fa-solid fa-door-open"></i>',
  brush: '<i class="fa-solid fa-brush"></i>',
  format_paint: '<i class="fa-solid fa-paint-roller"></i>',
  ac_unit: '<i class="fa-solid fa-fan"></i>',
  kitchen: '<i class="fa-solid fa-kitchen-set"></i>',
  settings: '<i class="fa-solid fa-gear"></i>',
  videocam: '<i class="fa-solid fa-video"></i>',
  security: '<i class="fa-solid fa-shield-alt"></i>',
  lock: '<i class="fa-solid fa-lock"></i>',
  shield: '<i class="fa-solid fa-shield"></i>',
  air: '<i class="fa-solid fa-wind"></i>',
  fireplace: '<i class="fa-solid fa-fire"></i>',
  build: '<i class="fa-solid fa-tools"></i>',
  cleaning_services: '<i class="fa-solid fa-broom"></i>',
  home_repair_service: '<i class="fa-solid fa-house"></i>',
  water: '<i class="fa-solid fa-water"></i>',
  window: '<i class="fa-solid fa-window-maximize"></i>',
  inventory_2: '<i class="fa-solid fa-boxes"></i>',
  garage: '<i class="fa-solid fa-warehouse"></i>',
  fence: '<i class="fa-solid fa-fence"></i>',
  deck: '<i class="fa-solid fa-layer-group"></i>',
  pool: '<i class="fa-solid fa-water-ladder"></i>',
  smoke_detector: '<i class="fa-solid fa-smoke"></i>',
  smart_home: '<i class="fa-solid fa-home"></i>',
  cash: '<i class="fa-solid fa-money-bill"></i>',
  card: '<i class="fa-solid fa-credit-card"></i>',
  gcash: '<i class="fa-solid fa-wallet"></i>',
  paypal: '<i class="fa-brands fa-paypal"></i>',
  maya: '<i class="fa-solid fa-money-check"></i>',
  default: '<i class="fa-solid fa-cogs"></i>',
};

function getIconHtml(iconName) {
  return iconLibrary[iconName] || iconLibrary['default'];
}

document.addEventListener('DOMContentLoaded', async () => {
  fetchServiceType();
  assistantInit();
  initMap();
});

let serviceItems = [];

const fetchServiceType = async () => {
  try {
    const response = await fetch(
      'https://api.manongapp.com/api/service-items',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    );

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const jsonData = await response.json();
    const data = jsonData.data;
    serviceItems = data;

    const serviceTypeArea = document.getElementById('serviceTypeArea');
    serviceTypeArea.className = 'grid grid-cols-3 sm:grid-cols-4 gap-2';
    serviceTypeArea.innerHTML = '';

    data.forEach((item) => {
      const iconColor = item.iconColor;
      const label = document.createElement('label');
      label.className = 'block cursor-pointer';
      const div = document.createElement('div');
      div.className = 'flex flex-col gap-1 sm:gap-2 items-center';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = 'services';
      checkbox.value = item.id;
      checkbox.className = 'peer hidden';
      const chip = document.createElement('div');
      chip.className = `bg-[${iconColor}] border rounded-2xl p-3 sm:p-4 text-center transition-all peer-checked:border-[#034B57] peer-checked:bg-[#04697D] hover:border-[#04697D] w-12 h-12 sm:w-14 sm:h-14 text-white flex items-center justify-center text-sm sm:text-base`;
      const title = document.createElement('p');
      title.className = 'text-center text-xs sm:text-sm';
      title.textContent = item.title;

      label.appendChild(div);
      div.appendChild(checkbox);
      chip.innerHTML = getIconHtml(item.iconName);
      div.appendChild(chip);
      div.appendChild(title);

      serviceTypeArea.appendChild(label);
      checkbox.addEventListener('change', handleServiceChange);
    });
  } catch (e) {
    console.error('Error fetching service items:', e);
  }
};

const handleAddAssistant = () => {
  const assistantArea = document.getElementById('assistantArea');

  if (assistantArea.children.length >= MAX_ASSISTANTS) {
    return;
  }

  const div = document.createElement('div');
  div.className =
    assistantArea.children.length == 0 ? 'flex gap-2 mt-6' : 'flex gap-2 mt-2';

  const input = document.createElement('input');
  input.type = 'text';
  input.name = 'assistantsFullname[]';
  input.placeholder = "Assistant's full name";
  input.className =
    'flex-1 p-2 sm:p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#04697D] text-sm sm:text-base';
  input.required = true;

  const plusDiv = document.createElement('div');
  plusDiv.className =
    'flex items-center justify-center border rounded-md px-3 cursor-pointer hover:bg-gray-100 add-assistant';
  plusDiv.innerHTML = '<i class="fa-solid fa-plus"></i>';

  const minusDiv = document.createElement('div');
  minusDiv.className =
    'flex items-center justify-center border rounded-md px-3 cursor-pointer hover:bg-gray-100 minus-assistant';
  minusDiv.innerHTML = '<i class="fa-solid fa-minus"></i>';

  if (assistantArea.children.length === 0) {
    minusDiv.style.pointerEvents = 'none';
    minusDiv.style.opacity = '0.5';
  }

  div.append(input, plusDiv, minusDiv);
  assistantArea.appendChild(div);
};

const assistantInit = () => {
  const assistantRadios = document.querySelectorAll(
    'input[name="assistantRadio"]',
  );
  const assistantArea = document.getElementById('assistantArea');

  assistantRadios.forEach((radio, index) => {
    radio.addEventListener('change', () => {
      if (index == 0) {
        assistantArea.classList.remove('hidden');
        handleAddAssistant();
      } else {
        assistantArea.classList.add('hidden');
        assistantArea.innerHTML = '';
      }
    });
  });

  assistantArea.addEventListener('click', (e) => {
    if (e.target.closest('.add-assistant')) {
      handleAddAssistant();
    }

    if (e.target.closest('.minus-assistant')) {
      const assistantRow = e.target.closest('#assistantArea > div');
      if (!assistantRow) return;

      const index = Array.from(assistantArea.children).indexOf(assistantRow);

      if (index === 0) return;

      assistantArea.removeChild(assistantRow);
    }
  });

  document
    .getElementById('debugAssistantInputs')
    .addEventListener('click', (e) => {
      const inputs = document.querySelectorAll(
        'input[name="assistantsFullname[]"]',
      );

      const values = Array.from(inputs).map((input) => input.value);

      console.log(values);
    });
};

function handleServiceChange() {
  const selectedIds = Array.from(
    document.querySelectorAll('input[name="services"]:checked'),
  ).map((cb) => parseInt(cb.value));
  const selectedServices = serviceItems.filter((item) =>
    selectedIds.includes(item.id),
  );

  const output = selectedServices.map((service) => ({
    serviceTitle: service.title,
    subServiceItems: service.subServiceItems.map((sub) => ({
      id: sub.id,
      title: sub.title,
      description: sub.description,
      iconName: sub.iconName,
    })),
  }));

  const subServiceArea = document.getElementById('subServiceItemsArea');
  subServiceArea.innerHTML = '';
  if (selectedIds.length == 0) {
    subServiceArea.innerHTML =
      '<p class="text-center text-gray-500 italic text-xs sm:text-sm">Please choose a Service Type above to see available Specialities.</p>';
  }
  output.forEach((service) => {
    const h3 = document.createElement('h3');
    h3.textContent = service.serviceTitle;
    h3.className = 'font-semibold mt-2 mb-2 text-sm sm:text-base';
    subServiceArea.appendChild(h3);

    const div = document.createElement('div');
    div.className = 'grid grid-cols-1 sm:grid-cols-2 gap-2';

    service.subServiceItems.forEach((sub) => {
      const label = document.createElement('label');
      label.className = 'block cursor-pointer';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = 'subServices';
      checkbox.value = sub.id;
      checkbox.className = 'peer hidden';
      label.appendChild(checkbox);

      const specialityDiv = document.createElement('div');
      specialityDiv.className = `flex flex-row border rounded-lg p-3 sm:p-4 transition-all peer-checked:border-[#034B57] peer-checked:bg-[#04697D] peer-checked:text-white hover:border-[#04697D] gap-2 items-center`;
      const icon = document.createElement('div');
      icon.className = 'text-sm sm:text-base';
      icon.innerHTML = getIconHtml(sub.iconName);
      const p = document.createElement('p');
      p.className = 'text-xs sm:text-sm';
      p.textContent = sub.title;
      specialityDiv.appendChild(icon);
      specialityDiv.appendChild(p);

      label.appendChild(specialityDiv);
      div.appendChild(label);
    });
    subServiceArea.appendChild(div);
  });
}

function setupDropzone(dropzoneId, inputId, fileNameId) {
  const dropzone = document.getElementById(dropzoneId);
  const input = document.getElementById(inputId);
  const fileName = document.getElementById(fileNameId);

  dropzone.addEventListener('click', () => input.click());

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('border-blue-500', 'bg-blue-50');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('border-blue-500', 'bg-blue-50');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('border-blue-500', 'bg-blue-50');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      input.files = files;
      fileName.textContent = `Selected file: ${files[0].name}`;
    }
  });

  input.addEventListener('change', () => {
    if (input.files.length > 0) {
      fileName.textContent = `Selected file: ${input.files[0].name}`;
    }
  });
}

setupDropzone('govIdDropzone', 'govIdInput', 'govIdFileName');
setupDropzone('nbiDropzone', 'nbiInput', 'nbiFileName');
setupDropzone('skillDropzone', 'skillInput', 'skillFileName');

function initMap() {
  const map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 14.5995, lng: 120.9842 },
    zoom: 12,
  });

  const marker = new google.maps.Marker({
    map,
    draggable: true,
    position: { lat: 14.5995, lng: 120.9842 },
  });

  const input = document.getElementById('addressInput');
  const autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.bindTo('bounds', map);

  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    if (!place.geometry) return;

    map.setCenter(place.geometry.location);
    map.setZoom(15);
    marker.setPosition(place.geometry.location);

    document.getElementById('latitude').value = place.geometry.location.lat();
    document.getElementById('longitude').value = place.geometry.location.lng();
  });

  marker.addListener('dragend', () => {
    const pos = marker.getPosition();
    document.getElementById('latitude').value = pos.lat();
    document.getElementById('longitude').value = pos.lng();
  });
}

function errorMessage(text) {
  const message = document.getElementById('message');
  message.textContent = text;
  message.classList.remove('text-blue-600');
  message.classList.add('text-red-600');
}

function successMessage(text) {
  const modal = document.getElementById('successModal');
  const modalMessage = document.getElementById('successModalMessage');

  modalMessage.textContent = text;
  modal.classList.remove('hidden');

  document.getElementById('successModalClose').onclick = () => {
    modal.classList.add('hidden');
    window.location.replace('https://manongapp.com');
  };
}

function infoMessage(text) {
  const message = document.getElementById('message');
  message.textContent = text;
  message.classList.add('text-blue-600');
}

document
  .getElementById('registrationForm')
  .addEventListener('submit', async function (event) {
    event.preventDefault();

    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password != confirmPassword) {
      errorMessage('Password and confirmation password do not match.');
      return;
    }

    const selectedServices = Array.from(
      document.querySelectorAll('input[name="services"]:checked'),
    ).map((cb) => cb.value);
    const selectedSubServices = Array.from(
      document.querySelectorAll('input[name="subServices"]:checked'),
    ).map((cb) => cb.value);

    const formData = new FormData();

    formData.append('firstName', document.getElementById('firstName').value);
    formData.append('lastName', document.getElementById('lastName').value);
    formData.append('email', document.getElementById('email').value);
    formData.append('phone', document.getElementById('phone').value);
    formData.append('password', password);
    formData.append('confirmPassword', confirmPassword);
    formData.append(
      'yearsExperience',
      document.getElementById('yearsExperience').value,
    );
    formData.append(
      'experienceDescription',
      document.getElementById('experienceDescription').value,
    );
    formData.append('latitude', document.getElementById('latitude').value);
    formData.append('longitude', document.getElementById('longitude').value);

    if (selectedServices.length === 0) {
      errorMessage('Please select at least one service.');
      return;
    }

    if (selectedSubServices.length === 0) {
      errorMessage('Please select at least one sub-service.');
      return;
    }

    selectedServices.forEach((id) => formData.append('serviceItems[]', id));
    selectedSubServices.forEach((id) =>
      formData.append('subServiceItems[]', id),
    );

    const assistantsFullname = document.querySelectorAll(
      'input[name="assistantsFullname[]"]',
    );

    const assistants = Array.from(assistantsFullname)
      .map((input) => input.value.trim())
      .filter((name) => name !== '')
      .map((name) => ({ fullName: name, phone: null }));

    formData.append('assistants', JSON.stringify(assistants));

    const skillFile = document.getElementById('skillInput').files[0];
    const nbiFile = document.getElementById('nbiInput').files[0];
    const govIdFile = document.getElementById('govIdInput').files[0];

    if (skillFile) {
      formData.append('skillImage', skillFile);
    } else {
      errorMessage('Skill image is missing.');
      return;
    }

    if (nbiFile) {
      formData.append('nbiImage', nbiFile);
    } else {
      errorMessage('NBI image is missing.');
      return;
    }

    if (govIdFile) {
      formData.append('govIdImage', govIdFile);
    } else {
      errorMessage('Government ID image is missing.');
      return;
    }

    infoMessage('Submitting... please wait.');
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;

    try {
      const response = await fetch(
        'https://api.manongapp.com/api/manongs/register',
        {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: formData,
        },
      );

      const result = await response.json();

      if (!response.ok) {
        errorMessage(result.message || 'Registration failed');
        return;
      }

      successMessage(result.message || 'Registration successfull!');
      document.getElementById('registrationForm').reset();
    } catch (e) {
      errorMessage('Registration failed: ' + e.message);
    } finally {
      submitBtn.disabled = false;
    }
  });

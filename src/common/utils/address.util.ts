import axios from 'axios';

export async function getFormattedAddressOSM(
  lat: number,
  lng: number,
): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'ManongApp' }, // required by OSM
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return response.data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch (error) {
    console.error('OSM geocoding error:', error);
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}

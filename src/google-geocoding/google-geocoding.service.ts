import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface GeocodeResult {
  address_components: AddressComponent[];
  formatted_address: string;
  place_id: string;
}

interface GeocodeResponse {
  results: GeocodeResult[];
  status: string;
}

@Injectable()
export class GoogleGeocodingService {
  private readonly logger = new Logger(GoogleGeocodingService.name);
  private readonly apiKey = process.env.GOOGLE_API_KEY;

  async getFormattedAddress(lat: number, lng: number): Promise<string> {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${this.apiKey}`;
      const response = await axios.get<GeocodeResponse>(url);
      const data = response.data;

      if (data.status === 'OK' && data.results.length > 0) {
        const components = data.results[0].address_components;

        const street = components.find((c) =>
          c.types.includes('route'),
        )?.long_name;
        const sublocality = components.find(
          (c) =>
            c.types.includes('sublocality_level_1') ||
            c.types.includes('sublocality'),
        )?.long_name;
        const city = components.find((c) =>
          c.types.includes('locality'),
        )?.long_name;
        const province = components.find((c) =>
          c.types.includes('administrative_area_level_2'),
        )?.long_name;
        const region = components.find((c) =>
          c.types.includes('administrative_area_level_1'),
        )?.long_name;
        const country = components.find((c) =>
          c.types.includes('country'),
        )?.long_name;

        const fullAddress = [
          street,
          sublocality,
          city,
          province,
          region,
          country,
        ]
          .filter(Boolean)
          .join(', ');

        return fullAddress;
      } else {
        this.logger.warn(`Geocoding failed: ${data.status}`);
        return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      }
    } catch (error: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Geocoding error: ${error?.message || error}`);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }
}

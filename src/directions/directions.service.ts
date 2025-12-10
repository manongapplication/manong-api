import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class DirectionsService {
  private readonly apiKey = process.env.GOOGLE_API_KEY;
  private readonly logger: Logger = new Logger(DirectionsService.name);

  async getRoute(origin: string, destination: string) {
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${this.apiKey}`;
      const response = await axios.get(url);
      return response.data;
    } catch (e) {
      this.logger.error(`Error fetching directions ${e}`);
      throw new Error('Failed to fetch directions from Google API');
    }
  }
}

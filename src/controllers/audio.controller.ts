import { Route, Tags, Post, UploadedFile, Header, Security } from 'tsoa';
import validateHeaders from '../helper/validateHeader';
import getPincodeFromCoordinates from '../helper/convertLatLongToPincode';
import fetchJwtToken from '../helper/fetchAiJwtToken';

interface AudioProcessResponse {
  taskId: string;
}

@Route('audio')
@Tags('Audio')
@Security("jwt")
export class AudioController {
  /**
   * Process an uploaded audio file and return a task ID.
   * @param userAgent The User-Agent header for device identification. Eg: `CustomAgent/1.0 (lat: <latitude>; lon: <longitude>)`
   * @param file The uploaded MP3 audio file
   * @returns A task ID for the processed audio
   */
  @Post('/')
  public async processAudio(
    @Header('user-agent') userAgent: string | undefined,
    @UploadedFile('audio') audio: any,
  ): Promise<AudioProcessResponse> {
    if (!audio || audio.mimetype !== 'audio/mpeg') {
      throw new Error('Only MP3 files are allowed!');
    }

    if (!userAgent || typeof userAgent === 'undefined') {
      throw new Error('Missing or invalid User-Agent header.');
    }

    const coordinates = validateHeaders(userAgent);
    if (!coordinates) {
      throw new Error('Invalid User-Agent header for extracting coordinates.');
    }

    const { latitude, longitude } = coordinates;

    // Get pincode from coordinates
    const pincode = await getPincodeFromCoordinates(latitude, longitude);

    // Fetch JWT token
    const jwtToken = await fetchJwtToken();

    // Create FormData for the API call
    const formData = new FormData();
    formData.append('audio', new Blob([audio.buffer], { type: audio.mimetype }), audio.originalname);
    formData.append('pincode', pincode);

    const response = await fetch('https://dev-ai-api.kpro42.com/api/audio/cart/enrich', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to process audio. ${await response.text()}`);
    }

    const data = await response.json();
    return { taskId: data.taskId };
  }
}

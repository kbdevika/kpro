
// Function to fetch pincode directly in backend (using lat and long)
export default async function getPincodeFromCoordinates(latitude: number, longitude: number) {
    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'GOOGLE_MAPS_API_KEY';

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;

    try {
        const response = await fetch(url);
        const json = await response.json();

        if (json.status !== 'OK') {
            throw new Error('Failed to fetch pincode');
        }

        // Extract pincode from address components
        const addressComponents = json.results[0]?.address_components;
        const pincode = addressComponents?.find((component: any) =>
            component.types.includes('postal_code')
        )?.long_name;

        if (pincode) {
            return pincode;
        } else {
            throw new Error('Pincode not found');
        }

    } catch (error) {
        throw new Error('Failed to fetch pincode');
    }
}
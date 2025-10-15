import { Loader } from '@googlemaps/js-api-loader';

let googleMapsLoaded = false;
let googleMapsPromise: Promise<void> | null = null;

export const loadGoogleMaps = async (apiKey: string): Promise<void> => {
  if (googleMapsLoaded) {
    return Promise.resolve();
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = (async () => {
    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'geometry']
    });

    await loader.load();
    googleMapsLoaded = true;
  })();

  return googleMapsPromise;
};

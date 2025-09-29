import { Loader } from '@googlemaps/js-api-loader';

let loaderPromise: Promise<typeof google> | null = null;

export const loadGoogleMaps = (apiKey: string): Promise<typeof google> => {
  if (loaderPromise) {
    return loaderPromise;
  }

  const loader = new Loader({
    apiKey,
    version: 'weekly',
    libraries: ['places', 'geometry'],
  });

  loaderPromise = loader.load();
  return loaderPromise;
};

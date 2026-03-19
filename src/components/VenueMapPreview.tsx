import { MapPin, ExternalLink } from 'lucide-react';

interface VenueMapPreviewProps {
  latitude: number;
  longitude: number;
  name: string;
  address: string;
}

export default function VenueMapPreview({
  latitude,
  longitude,
  name,
  address,
}: VenueMapPreviewProps) {
  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=15&size=600x300&markers=color:red%7C${latitude},${longitude}&key=${import.meta.env.VITE_GOOGLE_PLACES_API_KEY}`;

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    name + ' ' + address
  )}&query_place_id=${latitude},${longitude}`;

  return (
    <div className="mt-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="relative">
        {import.meta.env.VITE_GOOGLE_PLACES_API_KEY ? (
          <>
            <img
              src={mapUrl}
              alt={`Map of ${name}`}
              className="w-full h-48 object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const fallback = document.createElement('div');
                  fallback.className =
                    'w-full h-48 bg-gray-100 dark:bg-gray-800 flex items-center justify-center';
                  fallback.innerHTML = `
                    <div class="text-center text-gray-500 dark:text-gray-400">
                      <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                      </svg>
                      <p>Map preview unavailable</p>
                    </div>
                  `;
                  parent.appendChild(fallback);
                }
              }}
            />
            <div className="absolute top-2 right-2 bg-white dark:bg-gray-800 rounded-full p-1.5 shadow-lg">
              <MapPin className="w-5 h-5 text-red-500" />
            </div>
          </>
        ) : (
          <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <MapPin className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">Map preview unavailable</p>
              <p className="text-xs mt-1">API key not configured</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 bg-white dark:bg-gray-800">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 dark:text-white truncate">
              {name}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {address}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </p>
          </div>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-3 flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors whitespace-nowrap"
          >
            <ExternalLink className="w-4 h-4" />
            Open in Maps
          </a>
        </div>
      </div>
    </div>
  );
}

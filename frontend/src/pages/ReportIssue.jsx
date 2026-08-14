import { useState } from 'react'
import LocationMap from "../components/LocationMap";

function ReportIssue() {
  const [selectedImage, setSelectedImage] = useState(null)
  const [location, setLocation] = useState(null)
  const handleMarkerMove = (latitude, longitude) => {
  setLocation({
    latitude,
    longitude,
  });
};
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">

      <div className="mx-auto max-w-xl">

        <h1 className="text-3xl font-bold text-gray-900">
          Report an Issue
        </h1>

        <p className="mt-2 text-gray-600">
          Help improve your city by reporting a civic problem.
        </p>

<div className="mt-8">
  <label
    htmlFor="category"
    className="block text-sm font-medium text-gray-700"
  >
    Issue Category
  </label>

  <select
    id="category"
    name="category"
    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
  >
    <option value="">Select an issue</option>
    <option value="road">Road Damage / Pothole</option>
    <option value="streetlight">Streetlight Problem</option>
    <option value="garbage">Garbage / Waste</option>
    <option value="water">Water / Drainage</option>
    <option value="sewage">Sewage Problem</option>
    <option value="other">Other</option>
  </select>
</div>

<div className="mt-6">
  <label
    htmlFor="description"
    className="block text-sm font-medium text-gray-700"
  >
    Describe the Issue
  </label>

  <textarea
    id="description"
    name="description"
    rows="5"
    placeholder="Describe the problem in detail..."
    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 placeholder-gray-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
  ></textarea>
</div>

{/* Photo Upload */}
<div className="mt-6">
  <label className="block text-sm font-medium text-gray-700">
    Add a Photo
  </label>

  <div className="mt-3 grid grid-cols-2 gap-3">

    {/* Take Photo */}
    <label
      htmlFor="camera"
      className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-4 text-center hover:bg-gray-50"
    >
      <span className="text-2xl">📷</span>

      <span className="mt-2 text-sm font-medium text-gray-700">
        Take Photo
      </span>
    </label>

    <input
      id="camera"
      type="file"
      accept="image/*"
      capture="environment"
      className="hidden"
      onChange={(event) => {
        const file = event.target.files[0]

        if (file) {
          setSelectedImage(URL.createObjectURL(file))
        }
      }}
    />

    {/* Choose from Gallery */}
    <label
      htmlFor="gallery"
      className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-4 text-center hover:bg-gray-50"
    >
      <span className="text-2xl">🖼️</span>

      <span className="mt-2 text-sm font-medium text-gray-700">
        Gallery / Files
      </span>
    </label>

    <input
      id="gallery"
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(event) => {
        const file = event.target.files[0]

        if (file) {
          setSelectedImage(URL.createObjectURL(file))
        }
      }}
    />

  </div>

  {/* Image Preview */}
  {selectedImage && (
    <div className="mt-4">
      <p className="mb-2 text-sm font-medium text-gray-700">
        Selected Photo
      </p>

      <a
  href={selectedImage}
  target="_blank"
  rel="noopener noreferrer"
>
  <img
    src={selectedImage}
    alt="Selected civic issue"
    className="w-full rounded-lg object-contain"
  />
</a>

      <button
        type="button"
        onClick={() => setSelectedImage(null)}
        className="mt-3 w-full rounded-lg border border-red-300 px-4 py-3 text-red-600 hover:bg-red-50"
      >
        Remove Photo
      </button>
    </div>
  )}

  <p className="mt-2 text-sm text-gray-500">
    Take a new photo or choose an existing image.
  </p>
</div>

{/* Location */}
<div className="mt-6">
  <label className="block text-sm font-medium text-gray-700">
    Issue Location
  </label>

<button
  type="button"
  onClick={() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      (error) => {
        alert('Unable to get your location. Please allow location access.')
        console.log(error)
      }
    )
  }}
  className="mt-3 w-full rounded-lg bg-blue-700 px-4 py-3 font-medium text-white hover:bg-blue-800"
>
  📍 Use Current Location
</button>

<LocationMap 
location={location}
onLocationChange={handleMarkerMove} />

{location && (
  <div className="mt-4 rounded-lg bg-green-50 p-4">
    <p className="text-sm font-medium text-green-800">
      Location detected successfully
    </p>

    <p className="mt-2 text-sm text-gray-700">
      Latitude: {location.latitude}
    </p>

    <p className="text-sm text-gray-700">
      Longitude: {location.longitude}
    </p>
  </div>
)}

  <p className="mt-2 text-sm text-gray-500">
    Use your current location to help authorities identify the issue.
  </p>
</div>

      </div>

    </main>
  )
}

export default ReportIssue
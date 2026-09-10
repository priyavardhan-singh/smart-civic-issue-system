import { useState } from 'react'
import LocationMap from "../components/LocationMap";

function ReportIssue() {
  const [selectedImage, setSelectedImage] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [location, setLocation] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [address, setAddress] = useState("")
  const [locationConfirmed, setLocationConfirmed] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const handleSearchLocation = async () => {
    setErrorMessage("")
  if (!searchQuery.trim()) {
    setErrorMessage("Please enter a location to search.")
    return
  }

  try {
    const response = await fetch(
  `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&q=${encodeURIComponent(searchQuery)}`
)

    const data = await response.json()

    if (data.length === 0) {
      setErrorMessage("Location not found. Please try another search.")
      setSearchResults([])
      return
    }

    setSearchResults(data)

  } catch (error) {
    console.error(error)  
  setErrorMessage("Unable to search for the location.")
  }
}

// Convert selected coordinates into a readable address
  const fetchAddress = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );

      const data = await response.json();

      if (data.display_name) {
        setAddress(data.display_name);
      } else {
        setAddress("Address not found");
        setErrorMessage("Unable to find a readable address for this location.");
      }
    } catch (error) {
      console.error(error);
      setAddress("Unable to find address");
      setErrorMessage("Unable to find a readable address for this location.");
    }
  };

  // Update location and find its readable address
const handleMarkerMove = (latitude, longitude) => {
  setLocationConfirmed(false);
  setErrorMessage("");
  
  setLocation({
    latitude,
    longitude,
  });

  fetchAddress(latitude, longitude);
};

const handleSubmit = async (event) => {
  event.preventDefault()

  setIsSubmitting(true)
  setSubmitSuccess(false)
  setErrorMessage("")

  if (!category) {
    setIsSubmitting(false)
    setErrorMessage("Please select an issue category.")
    return
  }

  if (!description.trim()) {
    setIsSubmitting(false)
    setErrorMessage("Please describe the issue.")
    return
  }

  if (!selectedFile) {
    setIsSubmitting(false)
    setErrorMessage("Please add a photo of the issue.")
    return
  }

  if (!location) {
    setIsSubmitting(false)
    setErrorMessage("Please select the issue location.")
    return
  }

  if (!locationConfirmed) {
    setIsSubmitting(false)
    setErrorMessage("Please confirm the issue location.")
    return
  }

  try {
    const formData = new FormData()

    formData.append("category", category)
    formData.append("description", description.trim())
    formData.append("latitude", String(location.latitude))
    formData.append("longitude", String(location.longitude))
    formData.append("address", address)
    formData.append("photo", selectedFile)

    const token = localStorage.getItem("access_token")

if (!token) {
  throw new Error("Please login before submitting a report.")
}

const response = await fetch(
  "http://127.0.0.1:8000/reports",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  }
)

    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        data.detail || "Failed to submit report."
      )
    }

    console.log(
      "Report submitted successfully:",
      data
    )

    setSubmitSuccess(true)

    // Reset form only after successful backend submission
    setCategory("")
    setDescription("")
    setSelectedImage(null)
    setSelectedFile(null)
    setLocation(null)
    setSearchQuery("")
    setSearchResults([])
    setAddress("")
    setLocationConfirmed(false)
    setErrorMessage("")
  } catch (error) {
    console.error(
      "Report submission error:",
      error
    )

    setErrorMessage(
      error instanceof Error
        ? error.message
        : "Unable to submit report. Please try again."
    )
  } finally {
    setIsSubmitting(false)
  }
}

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">

      <div className="mx-auto max-w-xl">
        <form onSubmit={handleSubmit}>

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
    value={category}
    onChange={(event) => setCategory(event.target.value)}
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
    value={description}
    onChange={(event) => setDescription(event.target.value)}
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
          setSelectedFile(file)
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
          setSelectedFile(file)
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
        onClick={() => {
  setSelectedImage(null)
  setSelectedFile(null)
}}
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
    setErrorMessage("")
    if (!navigator.geolocation) {
        setErrorMessage("Geolocation is not supported by this browser.")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
  const latitude = position.coords.latitude
  const longitude = position.coords.longitude

  setLocationConfirmed(false)
  setErrorMessage("")

  setLocation({
    latitude,
    longitude,
  })

  // Convert GPS coordinates into a readable address
  fetchAddress(latitude, longitude)
},
      (error) => {
        setErrorMessage("Unable to get your location. Please allow location access.")
        console.log(error)
      }
    )
  }}
  className="mt-3 w-full rounded-lg bg-blue-700 px-4 py-3 font-medium text-white hover:bg-blue-800"
>
  📍 Use Current Location
</button>

{/* Location Search */}
<div className="mt-4">
  <label
    htmlFor="location-search"
    className="block text-sm font-medium text-gray-700"
  >
    Search Location
  </label>

  <div className="mt-2 flex gap-2">
    <input
      id="location-search"
      type="text"
      placeholder="Enter address or landmark"
      value={searchQuery}
      onChange={(event) => setSearchQuery(event.target.value)}
      className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
    />

    <button
      type="button"
      onClick={handleSearchLocation}
      className="rounded-lg bg-gray-800 px-4 py-3 font-medium text-white hover:bg-gray-900"
    >
      Search
    </button>
  </div>

  {searchResults.length > 0 && (
    <div className="mt-3 rounded-lg border border-gray-200 bg-white">
      {searchResults.map((result, index) => (
        <button
          key={index}
          type="button"
          onClick={() => {
  const latitude = parseFloat(result.lat)
  const longitude = parseFloat(result.lon)

setLocationConfirmed(false)
setErrorMessage("")

  setLocation({
    latitude,
    longitude,
  })

  // Get the readable address for the selected search result
  fetchAddress(latitude, longitude)

  setSearchResults([])
}}
          className="block w-full border-b border-gray-200 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 last:border-b-0"
        >
          📍 {result.display_name}
        </button>
      ))}
    </div>
  )}
</div>

<LocationMap 
location={location}
onLocationChange={handleMarkerMove} />

{location && (
  <div className="mt-4 rounded-lg bg-green-50 p-4">
    <p className="text-sm font-medium text-green-800">
      Location selected successfully
    </p>

    {address && (
      <p className="mt-2 text-sm text-gray-700">
        <span className="font-medium">Address:</span> {address}
      </p>
    )}

    <p className="mt-2 text-sm text-gray-700">
      Latitude: {location.latitude}
    </p>

    <p className="text-sm text-gray-700">
      Longitude: {location.longitude}
    </p>

    <button
  type="button"
  onClick={() => {
    setLocationConfirmed(true)
  }}
  className="mt-4 w-full rounded-lg bg-green-700 px-4 py-3 font-medium text-white hover:bg-green-800"
>
  Confirm Location
</button>

{locationConfirmed && (
  <p className="mt-3 text-center text-sm font-medium text-green-700">
    ✓ Location confirmed
  </p>
)}

  </div>
)}

  <p className="mt-2 text-sm text-gray-500">
    Use your current location to help authorities identify the issue.
  </p>

  {errorMessage && (
  <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">
    {errorMessage}
  </p>
)}

<button
  type="submit"
  disabled={isSubmitting}
  className="mt-6 w-full rounded-lg bg-blue-700 px-4 py-3 font-medium text-white hover:bg-blue-800"
>
  {isSubmitting ? "Submitting..." : "Submit Report"}
</button>

{submitSuccess && (
  <p className="mt-3 text-center text-sm font-medium text-green-700">
    ✓ Report submitted successfully
  </p>
)}

</div>
        </form>
      </div>

    </main>
  )
}

export default ReportIssue
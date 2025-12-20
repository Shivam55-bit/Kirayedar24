import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import DepartureCity from "./GroupTourDeparture";

const ParticularItenaryTour = () => {
  const { itenaryTourId, cardId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tour, setTour] = useState(null);
  const [card, setCard] = useState(null);
  const [landingPage, setLandingPage] = useState(null);
  const [showApiResponse, setShowApiResponse] = useState(false);
  const [apiResponseData, setApiResponseData] = useState(null);
  const [formData, setFormData] = useState({
    itenaryTourId: "",
    cardId: "",
    mainHeading: "",
    subHeading: "",
    description: "",
    icons: [],
    highlights: [],
    map: {
      coordinates: { lat: "", lng: "" },
      countryId: "",
      zoom: 10
    },
    tourInformation: "",
    tourCost: "",
    paymentTerms: "",
    cancellationPolicy: "",
    termsAndConditions: "",
    backgroundImages: [],
    similarPackages: []
  });
  const [previewImages, setPreviewImages] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // Predefined icon options matching the travel features
  const predefinedIcons = [
    { title: "Hotels", icon: "fas fa-hotel", image: "icons/hotel (1).png" },
    { title: "Meals", icon: "fas fa-utensils", image: "icons/meal.png" },
    { title: "Sightseeing", icon: "fas fa-binoculars", image: "icons/sight.png" },
    { title: "Breakfast", icon: "fas fa-coffee", image: "icons/Breakfast.png" },
    { title: "Private Transfers", icon: "fas fa-car", image: "icons/car (1).png" },
    { title: "Flights", icon: "fas fa-plane", image: "icons/airplane (1).png" },
    { title: "Coach Transfer", icon: "fas fa-bus", image: "icons/bus (1).png" },
    { title: "Ferry", icon: "fas fa-ship", image: "icons/cruise (1).png" },
    { title: "Train", icon: "fas fa-train", image: "icons/train (1).png" },

  ];

  // Handle icon selection from predefined options
  const handleIconSelection = (selectedIcon) => {
    // Check if icon is already selected
    const isAlreadySelected = formData.icons.some(icon => icon.title === selectedIcon.title);

    if (!isAlreadySelected) {
      setFormData({
        ...formData,
        icons: [...formData.icons, {
          title: selectedIcon.title,
          icon: selectedIcon.icon,
          image: selectedIcon.image,
          iconPreview: selectedIcon.image ? `/${selectedIcon.image}` : null
        }]
      });
    }
  };

  // Remove selected icon
  const removeSelectedIcon = (index) => {
    const updatedIcons = [...formData.icons];
    updatedIcons.splice(index, 1);
    setFormData({ ...formData, icons: updatedIcons });
  };

  // Handle custom icon upload (for new options)
  const handleCustomIconUpload = (title, file) => {
    if (file && title) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newIcon = {
          title: title,
          icon: file.name,
          iconFile: file,
          iconPreview: reader.result,
          isCustom: true
        };

        setFormData({
          ...formData,
          icons: [...formData.icons, newIcon]
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Add a new highlight field
  const addHighlight = () => {
    setFormData({
      ...formData,
      highlights: [...formData.highlights, { day: "", title: "", description: "", type: "daywise" }]
    });
  };

  // Remove a highlight field
  const removeHighlight = (index) => {
    const updatedHighlights = [...formData.highlights];
    updatedHighlights.splice(index, 1);
    setFormData({ ...formData, highlights: updatedHighlights });
  };

  // Handle highlight field changes
  const handleHighlightChange = (index, field, value) => {
    const updatedHighlights = [...formData.highlights];
    updatedHighlights[index][field] = value;
    setFormData({ ...formData, highlights: updatedHighlights });
  };

  // Add a new similar package
  const addSimilarPackage = () => {
    setFormData({
      ...formData,
      similarPackages: [...formData.similarPackages, {
        cost: {
          perPerson: "",
          totalPrice: "",
          currency: "INR"
        },
        title: "",
        subtitle: "",
        highlights: [""],
        description: "",
        image: null
      }]
    });
  };

  // Remove a similar package
  const removeSimilarPackage = (index) => {
    const updatedPackages = [...formData.similarPackages];
    updatedPackages.splice(index, 1);
    setFormData({ ...formData, similarPackages: updatedPackages });
  };

  // Handle similar package field changes
  const handleSimilarPackageChange = (index, field, value) => {
    const updatedPackages = [...formData.similarPackages];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      updatedPackages[index][parent][child] = value;
    } else {
      updatedPackages[index][field] = value;
    }
    setFormData({ ...formData, similarPackages: updatedPackages });
  };

  // Handle similar package highlight changes
  const handleSimilarPackageHighlightChange = (packageIndex, highlightIndex, value) => {
    const updatedPackages = [...formData.similarPackages];
    updatedPackages[packageIndex].highlights[highlightIndex] = value;
    setFormData({ ...formData, similarPackages: updatedPackages });
  };

  // Add a highlight to a similar package
  const addSimilarPackageHighlight = (packageIndex) => {
    const updatedPackages = [...formData.similarPackages];
    updatedPackages[packageIndex].highlights.push("");
    setFormData({ ...formData, similarPackages: updatedPackages });
  };

  // Remove a highlight from a similar package
  const removeSimilarPackageHighlight = (packageIndex, highlightIndex) => {
    const updatedPackages = [...formData.similarPackages];
    updatedPackages[packageIndex].highlights.splice(highlightIndex, 1);
    setFormData({ ...formData, similarPackages: updatedPackages });
  };

  // Handle similar package image upload
  const handleSimilarPackageImageChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const updatedPackages = [...formData.similarPackages];
      updatedPackages[index].image = file;
      setFormData({ ...formData, similarPackages: updatedPackages });

      // Generate preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImages(prev => {
          const newPreviews = [...prev];
          newPreviews[index] = reader.result;
          return newPreviews;
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle map field changes
  const handleMapChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData({
        ...formData,
        map: {
          ...formData.map,
          [parent]: {
            ...formData.map[parent],
            [child]: value
          }
        }
      });
    } else {
      setFormData({
        ...formData,
        map: {
          ...formData.map,
          [field]: value
        }
      });
    }
  };

  // Handle background image upload
  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files);

    setFormData(prev => ({
      ...prev,
      backgroundImages: [...prev.backgroundImages, ...files]
    }));

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImages(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove background image
  const removeImage = (index) => {
    const updatedImages = [...formData.backgroundImages];
    updatedImages.splice(index, 1);

    const updatedPreviews = [...previewImages];
    updatedPreviews.splice(index, 1);

    setFormData({ ...formData, backgroundImages: updatedImages });
    setPreviewImages(updatedPreviews);
  };

  // Handle general form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Load itinerary tour and card data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const tourResponse = await axios.get(`https://globe.ridealmobility.com/api/itenary-tour/${itenaryTourId}`);
        if (tourResponse.data) {
          setTour(tourResponse.data);

          if (tourResponse.data.cards && tourResponse.data.cards.length > 0) {
            const selectedCard = tourResponse.data.cards.find(c => c._id === cardId);
            if (selectedCard) {
              setCard(selectedCard);
            } else {
              setError("Card not found in this tour");
            }
          } else {
            setError("No cards found in this tour");
          }
        }

        try {
          const landingPageResponse = await axios.get(`https://globe.ridealmobility.com/api/card-landing/tour/${itenaryTourId}/card/${cardId}`);
          if (landingPageResponse.data) {
            setLandingPage(landingPageResponse.data);
            setIsEditing(true);

            const pageData = landingPageResponse.data;
            setFormData({
              itenaryTourId,
              cardId,
              mainHeading: pageData.mainHeading || "",
              subHeading: pageData.subHeading || "",
              description: pageData.description || "",
              icons: pageData.icons || [],
              highlights: pageData.highlights || [],
              map: pageData.map || { coordinates: { lat: "", lng: "" }, countryId: "", zoom: 10 },
              tourInformation: pageData.tourInformation || "",
              tourCost: pageData.tourCost || "",
              paymentTerms: pageData.paymentTerms || "",
              cancellationPolicy: pageData.cancellationPolicy || "",
              termsAndConditions: pageData.termsAndConditions || "",
              backgroundImages: [],
              similarPackages: pageData.cards || []
            });

            if (pageData.backgroundImages && pageData.backgroundImages.length > 0) {
              const imagePreviews = pageData.backgroundImages.map(img =>
                `https://globe.ridealmobility.com/${img.replace(/\\/g, '/')}`
              );
              setPreviewImages(imagePreviews);
            }
          }
        } catch (err) {
          console.log("No existing landing page found, creating new");
          setFormData(prev => ({
            ...prev,
            itenaryTourId,
            cardId,
            similarPackages: []
          }));
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load tour data");
        setLoading(false);
      }
    };

    fetchData();
  }, [itenaryTourId, cardId]);

  const fetchLandingPageData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`https://globe.ridealmobility.com/api/card-landing/tour/${itenaryTourId}/card/${cardId}`);
      setApiResponseData(response.data);
      setShowApiResponse(true);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching landing page data:", err);
      alert("Failed to fetch landing page data");
      setLoading(false);
    }
  };

  const navigateToCard = (newCardId) => {
    navigate(`/itenary-tour/${itenaryTourId}/card/${newCardId}/landing-page`);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const formDataToSend = new FormData();

      formDataToSend.append('itenaryTourId', formData.itenaryTourId);
      formDataToSend.append('cardId', formData.cardId);
      formDataToSend.append('mainHeading', formData.mainHeading);
      formDataToSend.append('subHeading', formData.subHeading);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('tourInformation', formData.tourInformation);
      formDataToSend.append('tourCost', formData.tourCost);
      formDataToSend.append('paymentTerms', formData.paymentTerms);
      formDataToSend.append('cancellationPolicy', formData.cancellationPolicy);
      formDataToSend.append('termsAndConditions', formData.termsAndConditions);
      formDataToSend.append('icons', JSON.stringify(formData.icons));
      formDataToSend.append('highlights', JSON.stringify(formData.highlights));
      formDataToSend.append('map', JSON.stringify(formData.map));
      formDataToSend.append('cards', JSON.stringify(formData.similarPackages));

      if (formData.backgroundImages && formData.backgroundImages.length > 0) {
        formData.backgroundImages.forEach((image, index) => {
          formDataToSend.append(`backgroundImages`, image);
        });
      }

      // Handle similar package images
      formData.similarPackages.forEach((pkg, index) => {
        if (pkg.image) {
          formDataToSend.append('cardImages', pkg.image);
        }
      });

      // Handle icon file uploads
      formData.icons.forEach((icon, index) => {
        if (icon.iconFile) {
          formDataToSend.append('iconImages', icon.iconFile);
        }
      });

      let response;
      if (isEditing) {
        response = await axios.put(
          `https://globe.ridealmobility.com/api/card-landing/tour/${itenaryTourId}/card/${cardId}`,
          formDataToSend,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      } else {
        response = await axios.post(
          'https://globe.ridealmobility.com/api/landing-page',
          formDataToSend,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      }

      if (response.data) {
        alert(isEditing ? "Landing page updated successfully!" : "Landing page created successfully!");
        setLandingPage(response.data);
        setIsEditing(true);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error saving landing page:", err);
      alert("Failed to save landing page. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {isEditing ? "Edit Landing Page" : "Create Landing Page"}
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-6">
          {tour && card && (
            <div className="mb-8 p-4 bg-blue-50 rounded-md">
              <h2 className="text-lg font-semibold text-gray-800">Selected Tour Card</h2>
              <div className="flex mt-3">
                <div className="w-1/4">
                  {card.image && (
                    <img
                      src={`https://globe.ridealmobility.com/${card.image.replace(/\\/g, '/')}`}
                      alt={card.title}
                      className="w-full h-auto object-cover rounded-md"
                    />
                  )}
                </div>
                <div className="w-3/4 pl-4">
                  <p className="font-medium text-gray-700">{tour.title}</p>
                  <h3 className="text-xl font-bold">{card.title}</h3>
                  <p className="mt-2 text-gray-600">{card.description}</p>
                </div>
              </div>
            </div>
          )}

          <div className="border-b border-gray-200 mb-6">
            <nav className="flex -mb-px space-x-8">
              <button
                onClick={() => setActiveTab("general")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "general"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                General Information
              </button>
              <button
                onClick={() => setActiveTab("highlights")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "highlights"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                Icons & Highlights
              </button>
              <button
                onClick={() => setActiveTab("details")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "details"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                Tour Details
              </button>
              <button
                onClick={() => setActiveTab("images")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "images"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                Background Images
              </button>
              <button
                onClick={() => setActiveTab("similarPackages")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "similarPackages"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                Similar Packages
              </button>
              {/* <button
                onClick={() => setActiveTab("departureCities")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "departureCities"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                Departure Cities
              </button> */}
            </nav>
          </div>

          <form onSubmit={handleSubmit}>
            {activeTab === "general" && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="mainHeading" className="block text-gray-700 font-medium mb-2">
                    Main Heading
                  </label>
                  <input
                    type="text"
                    id="mainHeading"
                    name="mainHeading"
                    value={formData.mainHeading}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter main heading"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="subHeading" className="block text-gray-700 font-medium mb-2">
                    Sub Heading
                  </label>
                  <input
                    type="text"
                    id="subHeading"
                    name="subHeading"
                    value={formData.subHeading}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter sub heading"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-gray-700 font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={6}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter description"
                    required
                  ></textarea>
                  <p className="text-sm text-gray-500 mt-1">
                    HTML formatting is supported. Use tags like &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, etc.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "highlights" && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-700">Icons</h3>
                  </div>
                  <p className="text-sm text-gray-500">
                    Select icons that represent travel features like transportation, accommodation, etc.
                  </p>

                  {/* Available Icon Options */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 mb-3">Available Icons</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {predefinedIcons.map((iconOption, index) => {
                        const isSelected = formData.icons.some(icon => icon.title === iconOption.title);
                        return (
                          <div
                            key={index}
                            onClick={() => !isSelected && handleIconSelection(iconOption)}
                            className={`p-3 border rounded-lg cursor-pointer transition-all ${isSelected
                              ? 'border-green-500 bg-green-50 cursor-not-allowed'
                              : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                              }`}
                          >
                            <div className="flex flex-col items-center space-y-2">
                              {iconOption.image ? (
                                <img
                                  src={`/${iconOption.image}`}
                                  alt={iconOption.title}
                                  className="h-8 w-8 object-contain"
                                />
                              ) : (
                                <i className={`${iconOption.icon} text-2xl text-gray-600`}></i>
                              )}
                              <span className="text-xs text-center font-medium text-gray-700">
                                {iconOption.title}
                              </span>
                              {isSelected && (
                                <div className="text-green-600 text-xs">✓ Selected</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selected Icons Display */}
                  {formData.icons.length > 0 && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-700 mb-3">Selected Icons ({formData.icons.length})</h4>
                      <div className="space-y-2">
                        {formData.icons.map((selectedIcon, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              {selectedIcon.iconPreview ? (
                                <img
                                  src={selectedIcon.iconPreview}
                                  alt={selectedIcon.title}
                                  className="h-6 w-6 object-contain"
                                />
                              ) : (
                                <i className={`${selectedIcon.icon} text-lg text-gray-600`}></i>
                              )}
                              <span className="font-medium text-gray-700">{selectedIcon.title}</span>
                              {selectedIcon.isCustom && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Custom</span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeSelectedIcon(index)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                <div className="space-y-4 mt-8">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-700">Highlights</h3>
                    <button
                      type="button"
                      onClick={addHighlight}
                      className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                    >
                      Add Highlight
                    </button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Add highlight types (e.g., adventure, luxury) to categorize the tour.
                  </p>
                  {formData.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-md">
                      <div className="flex-grow space-y-4">
                        <div>
                          <label className="block text-gray-700 text-sm font-medium mb-1">
                            Highlight Type
                          </label>
                          <input
                            type="text"
                            value={highlight.type || ""}
                            onChange={(e) => handleHighlightChange(index, 'type', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. adventure, luxury"
                            required
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeHighlight(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === "details" && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="tourInformation" className="block text-gray-700 font-medium mb-2">
                    Tour Information
                  </label>
                  <textarea
                    id="tourInformation"
                    name="tourInformation"
                    value={formData.tourInformation}
                    onChange={handleInputChange}
                    rows={6}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter detailed tour information (supports HTML)"
                  ></textarea>
                </div>

                <div>
                  <label htmlFor="tourCost" className="block text-gray-700 font-medium mb-2">
                    Tour Cost
                  </label>
                  <textarea
                    id="tourCost"
                    name="tourCost"
                    value={formData.tourCost}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter tour cost details (supports HTML)"
                  ></textarea>
                </div>

                <div>
                  <label htmlFor="paymentTerms" className="block text-gray-700 font-medium mb-2">
                    Payment Terms
                  </label>
                  <textarea
                    id="paymentTerms"
                    name="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter payment terms (supports HTML)"
                  ></textarea>
                </div>

                <div>
                  <label htmlFor="cancellationPolicy" className="block text-gray-700 font-medium mb-2">
                    Cancellation Policy
                  </label>
                  <textarea
                    id="cancellationPolicy"
                    name="cancellationPolicy"
                    value={formData.cancellationPolicy}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter cancellation policy (supports HTML)"
                  ></textarea>
                </div>

                <div>
                  <label htmlFor="termsAndConditions" className="block text-gray-700 font-medium mb-2">
                    Terms and Conditions
                  </label>
                  <textarea
                    id="termsAndConditions"
                    name="termsAndConditions"
                    value={formData.termsAndConditions}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter terms and conditions (supports HTML)"
                  ></textarea>
                </div>
              </div>
            )}

            {activeTab === "images" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Background Images</label>
                  <p className="text-sm text-gray-500 mb-2">Upload high-quality images for the landing page background.</p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImagesChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {previewImages.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">Image Previews</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {previewImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`Preview ${index + 1}`}
                            className="h-40 w-full object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "similarPackages" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-700">Similar Packages</h3>
                  <button
                    type="button"
                    onClick={addSimilarPackage}
                    className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                  >
                    Add Package
                  </button>
                </div>

                <p className="text-sm text-gray-500">
                  Add similar packages to showcase related tour options.
                </p>

                {formData.similarPackages.map((pkg, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-md">
                    <div className="flex-grow space-y-4">
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={pkg.title || ""}
                          onChange={(e) => handleSimilarPackageChange(index, 'title', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g. Spectacular Krabi & Phuket Getaway"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                          Subtitle
                        </label>
                        <input
                          type="text"
                          value={pkg.subtitle || ""}
                          onChange={(e) => handleSimilarPackageChange(index, 'subtitle', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g. 5N/6D · 2N Krabi · 3N Phuket"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                          Per Person Cost
                        </label>
                        <input
                          type="number"
                          value={pkg.cost.perPerson || ""}
                          onChange={(e) => handleSimilarPackageChange(index, 'cost.perPerson', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g. 55751"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                          Total Price
                        </label>
                        <input
                          type="number"
                          value={pkg.cost.totalPrice || ""}
                          onChange={(e) => handleSimilarPackageChange(index, 'cost.totalPrice', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g. 111502"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                          Currency
                        </label>
                        <select
                          value={pkg.cost.currency || "INR"}
                          onChange={(e) => handleSimilarPackageChange(index, 'cost.currency', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="INR">INR</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                          Description
                        </label>
                        <textarea
                          value={pkg.description || ""}
                          onChange={(e) => handleSimilarPackageChange(index, 'description', e.target.value)}
                          rows={3}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g. Enjoy stunning beaches, nightlife, and island tours."
                        ></textarea>
                      </div>

                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                          Image
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleSimilarPackageImageChange(index, e)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {previewImages[index] && (
                          <div className="mt-2">
                            <img
                              src={previewImages[index]}
                              alt={`Package ${index + 1} Preview`}
                              className="h-40 w-auto object-cover rounded-md"
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                          Highlights
                        </label>
                        {pkg.highlights.map((highlight, hIndex) => (
                          <div key={hIndex} className="flex items-center space-x-2 mb-2">
                            <input
                              type="text"
                              value={highlight}
                              onChange={(e) => handleSimilarPackageHighlightChange(index, hIndex, e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="e.g. Beach"
                            />
                            <button
                              type="button"
                              onClick={() => removeSimilarPackageHighlight(index, hIndex)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addSimilarPackageHighlight(index)}
                          className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                        >
                          Add Highlight
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeSimilarPackage(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove Package
                    </button>
                  </div>
                ))}
              </div>
            )}



            <div className="flex justify-end space-x-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition disabled:opacity-50"
              >
                {loading ? "Saving..." : (isEditing ? "Update Landing Page" : "Create Landing Page")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ParticularItenaryTour;
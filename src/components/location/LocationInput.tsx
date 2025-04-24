
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "lucide-react";
import { LoadScript, Autocomplete } from '@react-google-maps/api';
import { useState } from "react";

interface LocationInputProps {
  onLocationSelect: (location: string, coordinates: { lat: number, lng: number }) => void;
  onCurrentLocation: (coordinates: { lat: number, lng: number }, displayLocation: string) => void;
  isLoading: boolean;
  usingCurrentLocation: boolean;
  placeholder?: string;
}

const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';
const libraries: ("places")[] = ["places"];

export const LocationInput = ({
  onLocationSelect,
  onCurrentLocation,
  isLoading,
  usingCurrentLocation,
  placeholder = "Enter city, region, or location in India"
}: LocationInputProps) => {
  const [location, setLocation] = useState("");
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const { toast } = useToast();

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser does not support geolocation services.",
        variant: "destructive"
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      // Success callback
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Reverse geocode the coordinates to get state and country
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode(
          { location: { lat: latitude, lng: longitude } },
          (results, status) => {
            if (status === "OK" && results && results[0]) {
              const addressComponents = results[0].address_components;
              let state = "";
              let country = "";
              
              for (const component of addressComponents) {
                if (component.types.includes("administrative_area_level_1")) {
                  state = component.long_name;
                }
                if (component.types.includes("country")) {
                  country = component.long_name;
                }
              }
              
              const displayLocation = `${state}, ${country}`;
              onCurrentLocation({ lat: latitude, lng: longitude }, displayLocation);
            } else {
              onCurrentLocation(
                { lat: latitude, lng: longitude },
                "Current Location"
              );
            }
          }
        );
      },
      // Error callback
      (error) => {
        let errorMessage = "Failed to get your location.";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access was denied. Please enable location permissions in your browser.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "The request to get your location timed out.";
            break;
        }
        
        toast({
          title: "Location Error",
          description: errorMessage,
          variant: "destructive"
        });
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
    const bounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(6.7559, 68.1862),  // Southwest corner of India
      new google.maps.LatLng(35.6745, 97.3956)  // Northeast corner of India
    );
    
    autocomplete.setBounds(bounds);
    autocomplete.setOptions({
      componentRestrictions: { country: "in" },
      types: ["geocode", "establishment"],
      strictBounds: true
    });
    
    setAutocomplete(autocomplete);
  };

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      
      if (place.geometry && place.geometry.location) {
        const coordinates = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };
        
        setLocation(place.formatted_address || "");
        onLocationSelect(
          place.formatted_address || place.name || "",
          coordinates
        );
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2 md:col-span-3">
          <Label htmlFor="location">Location</Label>
          <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={libraries}>
            <Autocomplete
              onLoad={onLoad}
              onPlaceChanged={onPlaceChanged}
            >
              <Input
                id="location"
                placeholder={placeholder}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={usingCurrentLocation}
              />
            </Autocomplete>
          </LoadScript>
        </div>
        <div className="flex items-end">
          <Button 
            type="submit" 
            className="w-full bg-farm-primary hover:bg-farm-dark"
            disabled={isLoading || usingCurrentLocation}
          >
            {isLoading && !usingCurrentLocation ? "Searching..." : "Search"}
          </Button>
        </div>
      </div>
      
      <div className="flex items-center justify-center">
        <div className="h-px bg-border flex-1" />
        <span className="px-3 text-xs text-muted-foreground">OR</span>
        <div className="h-px bg-border flex-1" />
      </div>
      
      <Button 
        type="button" 
        variant="outline"
        className="w-full flex items-center justify-center gap-2"
        onClick={handleGetCurrentLocation}
        disabled={isLoading}
      >
        <Navigation className="h-4 w-4" />
        {isLoading && usingCurrentLocation ? "Getting Location..." : "Use My Current Location"}
      </Button>
    </div>
  );
};

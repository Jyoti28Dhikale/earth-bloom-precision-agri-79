
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "lucide-react";
import { useState } from "react";

interface LocationInputProps {
  onLocationSelect: (location: string, coordinates: { lat: number, lng: number }) => void;
  onCurrentLocation: (coordinates: { lat: number, lng: number }, displayLocation: string) => void;
  isLoading: boolean;
  usingCurrentLocation: boolean;
  placeholder?: string;
}

export const LocationInput = ({
  onLocationSelect,
  onCurrentLocation,
  isLoading,
  usingCurrentLocation,
  placeholder = "Enter city, region, or location in India"
}: LocationInputProps) => {
  const [location, setLocation] = useState("");
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
        
        // Mock reverse geocoding since we can't use the Google Maps API without a proper key
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
          .then(response => response.json())
          .then(data => {
            let state = "";
            let country = "";
            
            if (data.address) {
              state = data.address.state || data.address.region || "";
              country = data.address.country || "";
            }
            
            const displayLocation = state && country ? `${state}, ${country}` : "Current Location";
            onCurrentLocation({ lat: latitude, lng: longitude }, displayLocation);
            
            toast({
              title: "Location Found",
              description: `Using location: ${displayLocation}`
            });
          })
          .catch(error => {
            console.error("Error fetching location details:", error);
            onCurrentLocation(
              { lat: latitude, lng: longitude },
              "Current Location"
            );
            
            toast({
              title: "Location Found",
              description: "Using current location"
            });
          });
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

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) {
      toast({
        title: "Location Required",
        description: "Please enter a location to search.",
        variant: "destructive"
      });
      return;
    }
    
    // Use OpenStreetMap Nominatim API for geocoding
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}${placeholder.includes("India") ? "&countrycodes=in" : ""}`)
      .then(response => response.json())
      .then(data => {
        if (data && data.length > 0) {
          const result = data[0];
          const coordinates = {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon)
          };
          
          const displayName = result.display_name || location;
          onLocationSelect(displayName, coordinates);
          
          toast({
            title: "Location Found",
            description: `Found location: ${displayName}`
          });
        } else {
          toast({
            title: "Location Not Found",
            description: "Could not find the specified location. Please try a different search term.",
            variant: "destructive"
          });
        }
      })
      .catch(error => {
        console.error("Error geocoding location:", error);
        toast({
          title: "Search Error",
          description: "An error occurred while searching for the location. Please try again.",
          variant: "destructive"
        });
      });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2 md:col-span-3">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            placeholder={placeholder}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={usingCurrentLocation}
          />
        </div>
        <div className="flex items-end">
          <Button 
            type="button" 
            onClick={handleManualSearch}
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

import React, { useState, useEffect } from "react";
import { View, StyleSheet, Platform } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

interface Location {
  latitude: number;
  longitude: number;
  tripId: string;
  stopId: string;
  label?: string;
}

interface LiveMapComponentProps {
  locations: Location[];
}

const LiveMapComponent: React.FC<LiveMapComponentProps> = ({ locations }) => {
  const [region, setRegion] = useState({
    latitude: locations[0]?.latitude || 37.7749, // Default to San Francisco
    longitude: locations[0]?.longitude || -122.4194,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  useEffect(() => {
    if (locations.length > 0) {
      setRegion({
        latitude: locations[0].latitude,
        longitude: locations[0].longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  }, [locations]);

  return (
    <View style={styles.container}>
      <MapView
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined} // Use Google Maps on Android, Apple Maps on iOS
        style={styles.map}
        region={region}
        onRegionChangeComplete={(newRegion) => setRegion(newRegion)}
      >
        {locations.map((location) => (
          <Marker
            key={location.tripId}
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title={location.label || "Train Location"}
            description={`Trip ID: ${location.tripId}, Stop ID: ${location.stopId}`}
          />
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default LiveMapComponent;

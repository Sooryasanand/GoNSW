import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Colors } from "@/constants/Colors";
import { useLocalSearchParams } from "expo-router";
import { useRouter } from "expo-router";
import AntDesign from "react-native-vector-icons/AntDesign";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";

const InterchangeDetails = () => {
  const { journey, startStaion, lastStation } = useLocalSearchParams();
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  let journeyData = null;

  try {
    journeyData = journey ? JSON.parse(journey) : null;
  } catch (error) {
    console.error("Failed to parse journey data:", error);
  }

  useEffect(() => {
    const checkSavedJourney = async () => {
      try {
        const savedJourney = await AsyncStorage.getItem("savedJourney");
        if (savedJourney && journeyData && journeyData.legs) {
          const parsedJourney = JSON.parse(savedJourney);

          // Get first and last station from the journeyData
          const firstStation = journeyData.legs[0]?.station;
          const lastStation =
            journeyData.legs[journeyData.legs.length - 1]?.station;

          if (
            parsedJourney.from === firstStation &&
            parsedJourney.to === lastStation
          ) {
            setSaved(true);
          }
        }
      } catch (error) {
        console.error("Error checking saved journey:", error);
      }
    };

    checkSavedJourney();
  }, [journeyData]);

  const handleJourneyPress = (selectedLeg) => {
    router.push({
      pathname: "/[journey]",
      params: {
        journey: JSON.stringify(selectedLeg),
      },
    });
  };

  const saveJourney = async (leg) => {
    try {
      // Toggle the saved state (optional UI state management)
      setSaved((prevSaved) => !prevSaved);

      // Create the journey object with start and end stations
      const newJourney = {
        from: startStaion.split(",")[0].split(" Station")[0],
        to: lastStation.split(",")[0].split(" Station")[0],
      };

      // Retrieve and update saved journeys in AsyncStorage
      const existingJourneys = await AsyncStorage.getItem("savedJourneys");
      const journeysArray = existingJourneys
        ? JSON.parse(existingJourneys)
        : [];
      journeysArray.push(newJourney);

      // Save updated journey list back to AsyncStorage
      await AsyncStorage.setItem(
        "savedJourneys",
        JSON.stringify(journeysArray)
      );
      console.log("Journey saved successfully!", journeysArray);
    } catch (error) {
      console.error("Error saving journey:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.headerLeftContainer}>
          <TouchableOpacity onPress={() => router.back()}>
            <AntDesign name="left" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.titleText}>GoNSW</Text>
        </View>
        <TouchableOpacity
          style={styles.headerRightContainer}
          onPress={saveJourney}
        >
          {saved ? (
            <View>
              <FontAwesome name="star" size={20} color="#FFFFFF" />
            </View>
          ) : (
            <View>
              <FontAwesome name="star-o" size={20} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {journeyData &&
        Array.isArray(journeyData.legs) &&
        journeyData.legs.length > 0 ? (
          journeyData.legs.map((leg, index) => (
            <TouchableOpacity
              key={index}
              style={styles.stopContainer}
              onPress={() => handleJourneyPress(leg)}
            >
              {/* Route Icon and Station Name */}
              <View style={styles.iconStationContainer}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: Colors[leg.routeNo] || Colors.TDefault },
                  ]}
                >
                  <Text style={styles.iconText}>{leg.routeNo}</Text>
                </View>
                <View>
                  <Text style={styles.stationText}>{leg.station}</Text>
                </View>
              </View>

              {/* Timing and Status Information */}
              <View style={styles.timingInfo}>
                <Text style={styles.timeText}>Departure: {leg.departTime}</Text>
                <Text style={styles.timeText}>Arrival: {leg.arrivalTime}</Text>
              </View>

              {/* Interchange Indicator */}
              {leg.transferRequired && (
                <View style={styles.interchangeInfo}>
                  <Text style={styles.interchangeText}>
                    Interchange to {leg.transferRouteNo}
                  </Text>
                </View>
              )}

              {/* Travel Duration and Additional Info */}
              <View style={styles.additionalInfo}>
                <Text style={styles.durationText}>{leg.travelTime}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.errorText}>No journey data available.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "black",
    padding: 10,
    borderColor: "#fff",
    flex: 1,
  },
  headerLeftContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerContainer: {
    backgroundColor: "#242424",
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 20,
    paddingRight: 20,
    width: "100%",
  },
  titleText: {
    fontSize: 20,
    color: "white",
    fontWeight: "bold",
    marginLeft: 10,
  },
  scrollContainer: {
    flexDirection: "column",
    paddingVertical: 10,
    padding: 10,
    marginTop: 5,
  },
  stopContainer: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#fff",
    paddingBottom: 10,
  },
  iconStationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  iconText: {
    color: "white",
    fontSize: 12,
  },
  stationText: {
    color: "white",
    fontSize: 18,
  },
  timingInfo: {
    marginVertical: 5,
  },
  timeText: {
    color: "white",
    fontSize: 14,
    marginVertical: 5,
  },
  interchangeInfo: {
    marginVertical: 5,
    backgroundColor: "#333",
    padding: 5,
    borderRadius: 5,
  },
  interchangeText: {
    color: "orange",
    fontSize: 14,
  },
  additionalInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  durationText: {
    color: "white",
    fontSize: 14,
  },
  statusText: {
    color: "green",
    fontSize: 14,
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
  },
});

export default InterchangeDetails;

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import JourneyComponent from "@/components/journey/JourneyComponent";
import { useRouter } from "expo-router";
import AntDesign from "react-native-vector-icons/AntDesign";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";

const JourneyDetails = () => {
  const { journey, realTimeLocationId } = useLocalSearchParams();
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  let selectedLeg = null;

  try {
    selectedLeg = journey ? JSON.parse(journey) : null;
  } catch (error) {
    console.error("Failed to parse journey data:", error);
  }

  useEffect(() => {
    const checkSavedJourney = async () => {
      if (!selectedLeg) return; // Early return if selectedLeg is null

      try {
        const savedJourneys = await AsyncStorage.getItem("savedJourneys");
        const parsedJourneys = savedJourneys ? JSON.parse(savedJourneys) : [];

        console.log("Parsed Journeys:", parsedJourneys); // Log to inspect the entire structure

        // Check if the current journey matches any saved journey
        const isJourneySaved = parsedJourneys.some(
          (journey) =>
            journey.from ===
              selectedLeg.station.split(",")[0].split(" Station")[0] &&
            journey.to ===
              (selectedLeg.stops &&
                selectedLeg.stops[selectedLeg.stops.length - 1]?.name
                  .split(",")[0]
                  .split(" Station")[0])
        );

        if (isJourneySaved) {
          setSaved(true);
        }
      } catch (error) {
        console.error("Error checking saved journey:", error);
      }
    };

    checkSavedJourney();
  }, [selectedLeg]);

  const saveJourney = async (routeNo) => {
    try {
      const firstStation = selectedLeg.station || "Unknown";
      const stops = selectedLeg?.stops || [];
      const lastStation =
        stops.length > 0 ? stops[stops.length - 1].name : firstStation;

      const newJourney = {
        from: firstStation.split(",")[0].split(" Station")[0],
        to: lastStation.split(",")[0].split(" Station")[0],
        routeNo: routeNo,
      };

      // Retrieve the existing saved journeys
      const existingJourneys = await AsyncStorage.getItem("savedJourneys");
      const journeysArray = existingJourneys
        ? JSON.parse(existingJourneys)
        : [];

      // Check if the journey already exists
      const journeyIndex = journeysArray.findIndex(
        (journey) =>
          journey.from === newJourney.from &&
          journey.to === newJourney.to &&
          journey.routeNo === routeNo
      );

      if (journeyIndex !== -1) {
        // Journey already saved, so remove it
        journeysArray.splice(journeyIndex, 1);
        setSaved(false);
        console.log("Journey removed successfully!");
      } else {
        // Journey not saved, so add it
        journeysArray.push(newJourney);
        setSaved(true);
        console.log("Journey saved successfully!");
      }

      // Save the updated journeys array back to AsyncStorage
      await AsyncStorage.setItem(
        "savedJourneys",
        JSON.stringify(journeysArray)
      );
      console.log("Updated Journeys:", journeysArray);
    } catch (error) {
      console.error("Error saving/removing journey:", error);
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
          onPress={() => {
            {
              selectedLeg ? (
                saveJourney(selectedLeg.routeNo)
              ) : (
                <Text>No journey data available</Text>
              );
            }
          }}
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
      {selectedLeg ? (
        <View>
          <JourneyComponent
            routeNo={selectedLeg.routeNo}
            stationName={selectedLeg.station}
            platform={selectedLeg.platform}
            travelTime={selectedLeg.travelTime}
            departTime={selectedLeg.departTime}
            arrivalTime={selectedLeg.arrivalTime}
            stops={selectedLeg.stops}
            realTimeLocationId={realTimeLocationId}
          />
        </View>
      ) : (
        <Text>No journey data available</Text>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  headerContainer: {
    backgroundColor: "#242424",
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 20,
    paddingRight: 20,
    width: "100%",
    justifyContent: "space-between",
  },
  headerLeftContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerRightContainer: {},
  titleText: {
    fontSize: 20,
    color: "white",
    fontWeight: "bold",
    marginLeft: 10,
  },
});

export default JourneyDetails;

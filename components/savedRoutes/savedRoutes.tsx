import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/Colors";
import { useRouter } from "expo-router";

export default function SavedRoutes({
  routeNo = "-",
  departStation = "-",
  arrivalStation = "-",
  travelTime = "-",
  onDelete,
}) {
  const router = useRouter();

  const deleteJourney = async () => {
    try {
      // Retrieve existing journeys from AsyncStorage
      const existingJourneys = await AsyncStorage.getItem("savedJourneys");
      if (existingJourneys) {
        const journeysArray = JSON.parse(existingJourneys);

        Alert.alert(
          "Clear Saved Route",
          `Are you sure you want to permanently delete all saved routes from ${departStation} to ${arrivalStation}? This action cannot be undone.`,
          [
            {
              text: "Cancel",
              onPress: () => console.log("Cancel Pressed"),
              style: "cancel",
            },
            {
              text: "Yes",
              onPress: async () => {
                // Filter out the journey that matches `departStation` and `arrivalStation`
                const updatedJourneys = journeysArray.filter(
                  (journey) =>
                    journey.from !== departStation ||
                    journey.to !== arrivalStation
                );

                // Log the updated journeys for debugging
                console.log(
                  "Updated Journeys after Deletion:",
                  updatedJourneys
                );

                // Save the updated array back to AsyncStorage
                await AsyncStorage.setItem(
                  "savedJourneys",
                  JSON.stringify(updatedJourneys)
                );

                // Call onDelete to refresh the list in the parent component
                onDelete(); // Notify parent to re-fetch
                console.log("Journey deleted successfully!");
              },
            },
          ],
          { cancelable: true }
        );
      } else {
        console.log("No saved journeys found");
      }
    } catch (error) {
      console.error("Error deleting journey:", error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.leftContainer}
        onPress={() =>
          router.push({
            pathname: "routes",
            params: {
              departStation: departStation,
              arrivalStation: arrivalStation,
            },
          })
        }
      >
        <View style={styles.titleInfo}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image
              source={require("../../assets/images/SydTrain.png")} // Adjust the path to your image
              style={styles.image}
            />
          </View>
        </View>
        <View style={{ marginTop: 15 }}>
          <Text style={styles.stationName}>From: {departStation}</Text>
          <Text style={styles.stationName}>To: {arrivalStation}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={{ flex: 0 }}
        onPress={() => deleteJourney(departStation, arrivalStation)}
      >
        <FontAwesome name="star" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    justifyContent: "space-between",
    flexDirection: "row",
    backgroundColor: "#333",
    marginVertical: 5,
    borderRadius: 8,
  },
  image: {
    width: 22,
    height: 22,
    marginRight: 10,
  },
  leftContainer: {
    flex: 1,
    width: "100%",
  },
  titleInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stationName: {
    color: "white",
    marginBottom: 10,
    fontSize: 20,
  },
});

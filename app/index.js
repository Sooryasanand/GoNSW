import SavedRoutes from "@/components/savedRoutes/savedRoutes";
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  Alert,
} from "react-native";
import AntDesign from "react-native-vector-icons/AntDesign";
import { useRouter } from "expo-router";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Home() {
  const router = useRouter();
  const [savedJourneys, setSavedJourneys] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSavedJourneys = async () => {
    try {
      const savedData = await AsyncStorage.getItem("savedJourneys");
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setSavedJourneys(parsedData);
      } else {
        setSavedJourneys([]);
      }
    } catch (error) {
      console.error("Error fetching saved journeys:", error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSavedJourneys();
    setRefreshing(false);
  }, [fetchSavedJourneys]);

  useEffect(() => {
    fetchSavedJourneys();
  }, []);

  const clearAsyncStorage = async () => {
    Alert.alert(
      "Clear Saved Routes",
      "Are you sure you want to delete all saved routes? This action is permanent and cannot be undone.",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: () => {
            AsyncStorage.clear();
            handleDelete();
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleDelete = () => {
    fetchSavedJourneys();
  };
  const renderSavedJourneys = () => {
    if (!savedJourneys?.length) {
      return <Text style={styles.noJourneysText}>No journeys saved.</Text>;
    }

    return savedJourneys.map((journey, index) => (
      <View key={index} style={styles.journeyContainer}>
        <SavedRoutes
          routeNo={journey.routeNo}
          departStation={journey.from}
          arrivalStation={journey.to}
          travelTime={journey.travelTime}
          onDelete={handleDelete}
        />
      </View>
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.HeaderContainer}>
        <Text style={styles.titleText}>GoNSW</Text>
        <TouchableOpacity onPress={() => router.push("routes")}>
          <AntDesign name="plus" size={30} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={this.clearAsyncStorage}>
        <Text>Clear Async</Text>
      </TouchableOpacity>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && !refreshing ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : (
          renderSavedJourneys()
        )}
        {savedJourneys?.length ? (
          <TouchableOpacity onPress={clearAsyncStorage}>
            <Text
              style={{
                color: "white",
                fontSize: 20,
                padding: 10,
                textAlign: "right",
              }}
            >
              Clear
            </Text>
          </TouchableOpacity>
        ) : (
          <View></View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "black",
    height: "100%",
  },
  HeaderContainer: {
    backgroundColor: "#242424",
    height: 70,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  titleText: {
    fontSize: 20,
    color: "white",
    fontWeight: "bold",
  },
  title: {
    fontSize: 20,
    color: "white",
    marginBottom: 20,
  },
  journeyContainer: {
    backgroundColor: "#333",
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    margin: 10,
  },
  journeyText: {
    color: "white",
    fontSize: 16,
    marginBottom: 5,
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    marginTop: 10,
    marginBottom: 5,
    fontWeight: "bold",
  },
  legContainer: {
    backgroundColor: "#444",
    padding: 8,
    marginVertical: 3,
    borderRadius: 3,
  },
  legText: {
    color: "white",
    fontSize: 14,
  },
  noLegsText: {
    color: "white",
    fontStyle: "italic",
    fontSize: 14,
    marginBottom: 5,
  },
  noJourneysText: {
    color: "white",
    textAlign: "center",
    marginVertical: 10,
  },
  loadingText: {
    color: "white",
    textAlign: "center",
    marginVertical: 10,
  },
});

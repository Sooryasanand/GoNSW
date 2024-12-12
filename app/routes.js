import Route from "@/components/routes/RoutesComponent";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from "react-native";
import { useState, useEffect } from "react";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { ScrollView } from "react-native-gesture-handler";
import AntDesign from "react-native-vector-icons/AntDesign";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { useLocalSearchParams } from "expo-router";
import DateTimePickerModal from "react-native-modal-datetime-picker";

export default function Routes() {
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [journeys, setJourneys] = useState([]);
  const [error, setError] = useState(null);
  const [isOnTime, setIsOnTime] = useState(false);
  const [location, setLocation] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);

  const router = useRouter();
  const { departStation, arrivalStation } = useLocalSearchParams();

  const getLocation = async () => {
    setLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.log("Permission to access location was denied");
      setLoading(false);
      return;
    }

    const currentLocation = await Location.getCurrentPositionAsync({});
    setLocation(currentLocation.coords);
    fetchNearbyPlaces(
      currentLocation.coords.latitude,
      currentLocation.coords.longitude
    );
  };

  const fetchNearbyPlaces = async (latitude, longitude) => {
    const url = `https://api.transport.nsw.gov.au/v1/tp/coord?outputFormat=rapidJSON&coord=${longitude}:${latitude}:EPSG:4326&coordOutputFormat=EPSG%3A4326&inclFilter=1&type_1=BUS_p&radius_1=3000&PoisOnMapMacro=true&version=10.2.1.42`;
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `apikey ${process.env.API_KEY}`,
        },
      });
      const data = await response.json();

      const closestCityMStation = data.locations
        .filter((location) => location.properties.GIS_DRAW_CLASS === "CityM")
        .sort((a, b) => a.properties.distance - b.properties.distance)[0];

      if (closestCityMStation) {
        setFrom(closestCityMStation.name);
      } else {
        Alert.alert("No Station found near you.");
      }
    } catch (error) {
      console.error("Error fetching nearby places:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStopId = async (stationName) => {
    const url = `https://api.transport.nsw.gov.au/v1/tp/stop_finder?outputFormat=rapidJSON&type_sf=stop&name_sf=${stationName} Station&coordOutputFormat=EPSG%3A4326&TfNSWSF=true&version=10.2.1.42`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `apikey ${process.env.API_KEY}`,
      },
    });
    const data = await response.json();
    const stopId = data.locations?.[0]?.properties?.stopId;
    if (!stopId) throw new Error(`Invalid station name: ${stationName}`);
    return stopId;
  };

  const fetchJourneyData = async (fromId, toId, selectedDate) => {
    if (!fromId || !toId) {
      alert("Please enter both origin and destination.");
      return;
    }

    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(selectedDate.getDate()).padStart(2, "0");
    const hours = String(selectedDate.getHours()).padStart(2, "0");
    const minutes = String(selectedDate.getMinutes()).padStart(2, "0");

    const url = `https://api.transport.nsw.gov.au/v1/tp/trip?outputFormat=rapidJSON&coordOutputFormat=EPSG%3A4326&depArrMacro=dep&itdDate=${year}${month}${day}&itdTime=${hours}${minutes}&type_origin=any&name_origin=${fromId}&type_destination=any&name_destination=${toId}&calcNumberOfTrips=10&wheelchair=on&excludedMeans=checkbox&exclMOT_4=1&exclMOT_5=1&exclMOT_7=1&exclMOT_9=1&exclMOT_11=1&TfNSWTR=true&version=10.2.1.42&itOptionsActive=1&onlyITBicycle=0&cycleSpeed=16`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `apikey ${process.env.API_KEY}`,
        },
      });

      const data = await response.json();

      if (!data.journeys || !Array.isArray(data.journeys)) {
        console.error("Invalid or missing journeys in response:", data);
        setJourneys([]);
        return;
      }
      setJourneys(data.journeys);
      return data.journeys;
    } catch (error) {
      console.error("Error fetching journey data:", error);
    }
  };

  const processJourneys = (journeysArray) => {
    const seenTrainIds = new Set();
    return journeysArray.map((journey) => {
      return {
        legs: journey.legs.map((leg, legIndex) => {
          const originInfo = leg.origin?.name?.split(",") || [
            "Unknown Station",
          ];
          const routeNo = leg.transportation?.disassembledName || "-";
          const station = originInfo[0] || "Unknown Station";
          const platform = originInfo[1] || "N/A";

          const depDate = leg.origin.departureTimeEstimated
            ? new Date(leg.origin.departureTimeEstimated)
            : null;
          const depHours = depDate
            ? String(depDate.getHours()).padStart(2, "0")
            : "--";
          const depMinutes = depDate
            ? String(depDate.getMinutes()).padStart(2, "0")
            : "--";

          const arrDate = leg.destination.arrivalTimeEstimated
            ? new Date(leg.destination.arrivalTimeEstimated)
            : null;
          const arrHours = arrDate
            ? String(arrDate.getHours()).padStart(2, "0")
            : "--";
          const arrMinutes = arrDate
            ? String(arrDate.getMinutes()).padStart(2, "0")
            : "--";

          const travelHours = leg.duration
            ? Math.floor(leg.duration / 3600)
            : 0;
          const travelMins = leg.duration
            ? Math.floor((leg.duration % 3600) / 60)
            : 0;
          const travelTime =
            travelHours > 0
              ? `${travelHours} hr ${travelMins} min`
              : `${travelMins} min`;

          const realTimeLocationId =
            leg.transportation.properties.RealtimeTripId;

          const transferDetails =
            legIndex < journey.legs.length - 1
              ? {
                  nextLegRouteNo:
                    journey.legs[legIndex + 1].transportation
                      ?.disassembledName || "N/A",
                }
              : null;

          setIsOnTime(
            leg.destination.arrivalTimeEstimated ===
              leg.destination.arrivalTimePlanned
          );

          const stops = Array.isArray(leg.stopSequence)
            ? leg.stopSequence.map((stop) => ({
                name: stop.name || "Unknown Stop",
                arrivalTime: stop.arrivalTimePlanned
                  ? new Date(stop.arrivalTimeEstimated).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "-",
                departureTime: stop.departureTimePlanned
                  ? new Date(stop.departureTimeEstimated).toLocaleTimeString(
                      [],
                      { hour: "2-digit", minute: "2-digit" }
                    )
                  : "-",
                platform: stop.properties?.platform || "-",
              }))
            : [];

          if (legIndex < journey.legs.length - 1) {
            const nextLeg = journey.legs[legIndex + 1];
            const nextRouteNo = nextLeg.transportation?.disassembledName || "-";
            interchange = `Interchange to ${nextRouteNo}`;
          }

          return {
            routeNo,
            station,
            platform,
            travelTime,
            departTime: `${depHours}:${depMinutes}`,
            arrivalTime: `${arrHours}:${arrMinutes}`,
            busy: 2,
            transferRequired: transferDetails !== null,
            transferRouteNo: transferDetails?.nextLegRouteNo || "-",
            stops,
            realTimeLocationId,
          };
        }),
        interchanges: journey.interchanges > 0,
      };
    });
  };

  const fetchJourneys = async () => {
    setLoading(true);
    setError(null);

    setFrom(from.trim());
    setTo(to.trim());

    try {
      const [stopFromId, stopToId] = await Promise.all([
        fetchStopId(from),
        fetchStopId(to),
      ]);
      const journeysData = await fetchJourneyData(
        stopFromId,
        stopToId,
        selectedDate
      );
      const processedJourneys = processJourneys(journeysData);
      setJourneys(processedJourneys);
    } catch (error) {
      console.error("Error fetching journeys:", error);
      setError(error.message || "Failed to fetch journeys");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!from || !to) {
      if (from && to) {
        fetchJourneys();
        const intervalId = setInterval(fetchJourneys, 30000);
        return () => clearInterval(intervalId);
      }
    }
  }, [from, to]);

  useEffect(() => {
    if (departStation !== "" && arrivalStation !== "") {
      setFrom(departStation);
      setTo(arrivalStation);
    }
  }, [departStation, arrivalStation]);

  const swapFromTo = () => {
    setFrom((prevFrom) => {
      setTo(prevFrom);
      return to;
    });
  };

  const handleJourneyPress = (
    journey,
    leg,
    transferRequired,
    realTimeLocationId
  ) => {
    const destinationPath = transferRequired
      ? "/InterchangeDetails"
      : "/[journey]";

    router.push({
      pathname: destinationPath,
      params: {
        journey: JSON.stringify(transferRequired ? journey : leg),
        startStaion: from,
        lastStation: to,
        realTimeLocationId: realTimeLocationId,
      },
    });
  };

  const renderJourneys = () => {
    if (error) {
      return (
        <View style={styles.centeredContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    if (!journeys.length) {
      return (
        <View style={styles.centeredContainer}>
          <Text style={styles.noJourneysText}>No journeys available.</Text>
        </View>
      );
    }

    // Filter out duplicate journeys with defensive checks
    const filteredJourneys = journeys.filter((journey, index, self) => {
      if (!journey || !journey.legs || journey.legs.length === 0) {
        console.warn(`Skipping malformed journey at index ${index}:`, journey);
        return false; // Skip malformed journey
      }

      const firstLeg = journey.legs[0];
      const lastLeg = journey.legs[journey.legs.length - 1];

      return (
        index ===
        self.findIndex((j) => {
          // Defensive checks for comparison
          if (!j || !j.legs || j.legs.length === 0) return false;

          const jFirstLeg = j.legs[0];
          const jLastLeg = j.legs[j.legs.length - 1];

          // Compare departure time, arrival time, and route numbers
          const isSameDepartTime = jFirstLeg.departTime === firstLeg.departTime;
          const isSameArrivalTime =
            jLastLeg.arrivalTime === lastLeg.arrivalTime;
          const isSameRoute =
            JSON.stringify(j.legs.map((leg) => leg.routeNo)) ===
            JSON.stringify(journey.legs.map((leg) => leg.routeNo));

          return isSameDepartTime && isSameArrivalTime && isSameRoute;
        })
      );
    });

    return filteredJourneys.map((journey, journeyIndex) => (
      <View key={`journey-${journeyIndex}`} style={styles.journeyContainer}>
        <TouchableOpacity
          key={`${journeyIndex}-0`}
          onPress={() =>
            handleJourneyPress(
              journey,
              journey.legs[0],
              journey.legs[0].transferRequired,
              journey.legs[0].realTimeLocationId
            )
          }
        >
          <Route
            routeColor="#F38E00"
            routeNo={journey.legs[0].routeNo}
            station={journey.legs[0].station}
            platform={journey.legs[0].platform}
            travelTime={journey.legs[0].travelTime}
            departTime={journey.legs[0].departTime}
            arrivalTime={journey.legs[0].arrivalTime}
            busy={journey.legs[0].busy}
            status={isOnTime ? "On Time" : "Delayed"}
            transferRequired={journey.legs[0].transferRequired}
            transferRouteNo={journey.legs[0].transferRouteNo || "-"}
          />
        </TouchableOpacity>
      </View>
    ));
  };

  const handleConfirm = (date) => {
    setSelectedDate(date); // Update the selected date and time
    hideDatePicker(); // Close the modal
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
          onPress={() => getLocation()}
        >
          <View>
            <FontAwesome name="location-arrow" size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.fromToInput}>
        <View style={styles.inputs}>
          <View style={styles.inputFieldContainer}>
            <Text style={styles.inputFieldText}>From</Text>
            <TextInput
              style={styles.inputField}
              value={from}
              onChangeText={(text) => {
                const transformedText = text.split(",")[0].split(" Station")[0];
                setFrom(transformedText);
              }}
            />
          </View>
          <View style={styles.inputFieldContainer}>
            <Text style={[styles.inputFieldText, { marginRight: 18 }]}>To</Text>
            <TextInput
              style={styles.inputField}
              value={to}
              onChangeText={(text) => {
                const transformedText = text.split(",")[0].split(" Station")[0];
                setTo(transformedText);
              }}
            />
          </View>
        </View>
        <TouchableOpacity onPress={swapFromTo} style={{ flex: 1 }}>
          <FontAwesome name="arrows-v" size={30} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <View style={styles.datePickerContainer}>
        <Text style={{ color: "white", marginRight: 22 }}>Depart</Text>
        <TouchableOpacity
          onPress={showDatePicker}
          style={styles.datePickerButton}
        >
          <Text style={styles.datePickerText}>
            {`${selectedDate.toLocaleDateString()}  ${selectedDate.toLocaleTimeString(
              [],
              {
                hour: "2-digit",
                minute: "2-digit",
              }
            )}`}
          </Text>
        </TouchableOpacity>
      </View>
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="datetime"
        date={selectedDate}
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
        is24Hour={true}
        minimumDate={new Date()}
      />
      <TouchableOpacity
        style={[
          styles.button,
          !from || !to ? styles.buttonDisabled : styles.buttonEnabled,
        ]}
        onPress={() => {
          fetchJourneys();
        }}
        disabled={!from || !to}
      >
        <Text style={styles.buttonText}>Search</Text>
      </TouchableOpacity>
      <View style={styles.horizontalLine} />
      <ScrollView>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="white" />
            <Text style={{ color: "white", marginTop: 20 }}>
              Loading Route...
            </Text>
          </View>
        ) : (
          renderJourneys()
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
  headerLeftContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerContainer: {
    backgroundColor: "#242424",
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    width: "100%",
    justifyContent: "space-between",
  },
  titleText: {
    fontSize: 20,
    color: "white",
    fontWeight: "bold",
    marginLeft: 10,
  },
  CenterText: {
    color: "#FFFF",
  },
  fromToInput: {
    flexDirection: "row",
    alignItems: "center",
    margin: 20,
    marginBottom: 10,
    width: "100%",
  },
  inputs: {
    flex: 6,
    height: 100,
    color: "black",
    marginRight: 20,
  },
  inputFieldContainer: {
    flexDirection: "row",
  },
  inputField: {
    backgroundColor: "#242424",
    margin: 5,
    flex: 1,
    color: "white",
    paddingHorizontal: 5,
    marginLeft: 33,
    borderWidth: 1,
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 15,
    fontSize: 15,
  },
  inputFieldText: {
    color: "white",
    marginVertical: 15,
  },
  horizontalLine: {
    width: "100%",
    height: 1,
    backgroundColor: "#FFFF",
    marginVertical: 10,
    marginTop: 20,
  },
  button: {
    backgroundColor: "white",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignContent: "center",
    marginHorizontal: 20,
    marginBottom: 10,
  },
  buttonText: {
    color: "black",
    fontSize: 16,
  },
  buttonEnabled: {
    backgroundColor: "white",
  },
  buttonDisabled: {
    backgroundColor: "grey",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  centeredContainer: {
    flex: 1,
    marginTop: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
  },
  noJourneysText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
  },
  transferText: {
    color: "gray",
    fontSize: 14,
    marginVertical: 5,
    textAlign: "center",
  },
  datePickerContainer: {
    alignItems: "center",
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 30,
  },
  datePickerButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
    flex: 1,
    marginRight: 36,
  },
  datePickerText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
});

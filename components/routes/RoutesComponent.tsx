import { StyleSheet, View, Text, Image } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import AntDesign from "react-native-vector-icons/AntDesign";
import { Colors } from "@/constants/Colors";

export default function RoutesComponent({
  routeNo = "-",
  travelTime = "-",
  departTime = "-",
  arrivalTime = "-",
  busy = 1,
  status = "On Time",
  transferRequired = false,
  transferRouteNo = "-",
}) {
  const getStatusColor = (status) => {
    switch (status) {
      case "On Time":
        return "green";
      case "Delayed":
        return "red";
      case "Cancelled":
        return "gray";
      default:
        return "black";
    }
  };

  return (
    <View>
      <View style={styles.container}>
        <View style={styles.titleInfo}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image
              source={require("../../assets/images/SydTrain.png")}
              style={styles.image}
            />
            <View
              style={[
                { borderRadius: 5, marginRight: 10 },
                { backgroundColor: Colors[routeNo] || Colors.TDefault },
              ]}
            >
              <Text style={{ color: "white", padding: 3 }}>{routeNo}</Text>
            </View>
            {transferRequired && (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <AntDesign name="caretright" color="white" />
                <View
                  style={[
                    { borderRadius: 5, marginLeft: 10 },
                    {
                      backgroundColor:
                        Colors[transferRouteNo] || Colors.TDefault,
                    },
                  ]}
                >
                  <Text style={{ color: "white", padding: 3 }}>
                    {transferRouteNo}
                  </Text>
                </View>
              </View>
            )}
          </View>
          <View>
            <Text style={styles.travelTime}>{travelTime}</Text>
          </View>
        </View>
        <View style={styles.timeCapacityInfo}>
          <View>
            <Text style={styles.travelHour}>
              {departTime} - {arrivalTime}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {[...Array(busy)].map((_, i) => (
              <Ionicons key={i} name="person" size={15} color="#FFFFFF" />
            ))}
          </View>
        </View>
        <Text style={[{ marginTop: 10, color: getStatusColor(status) }]}>
          {status}
        </Text>
      </View>
      <View style={styles.horizontalLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: 10,
  },
  image: {
    width: 22,
    height: 22,
    marginRight: 10,
  },
  titleInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeCapacityInfo: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stationInfo: {
    color: "white",
  },
  travelTime: {
    color: "white",
  },
  travelHour: {
    color: "white",
  },
  trainInfo: {
    marginLeft: 5,
    color: "white",
  },
  horizontalLine: {
    width: "100%", // Set width as a percentage or fixed value
    height: 1, // Set the height to create a thin line
    backgroundColor: "#FFFF", // Choose the line color
    marginVertical: 10, // Adds space above and below the line
  },
});

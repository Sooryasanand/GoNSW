import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { Colors } from "@/constants/Colors";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
const { height: screenHeight } = Dimensions.get("window");
const { width: screenWidth } = Dimensions.get("window");

const JourneyDetails = ({
  routeNo,
  stationName,
  platform,
  stops,
  travelTime,
  departTime,
  arrivalTime,
  realTimeLocationId,
}) => {
  const platformNo = platform.split(" ");
  const scrollViewRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [timeoutId, setTimeoutId] = useState(null);
  const router = useRouter();

  const startAutoScroll = () => {
    Animated.loop(
      Animated.timing(scrollY, {
        toValue: 50 * stops.length, // Adjust according to number of stops
        duration: stops.length * 3000, // Adjust speed of scrolling
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  // Function to stop auto-scroll and clear any active timer
  const stopAutoScroll = () => {
    scrollY.stopAnimation();
    setIsAutoScrolling(false);
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };

  // Restart auto-scroll after 10 seconds of inactivity
  const restartAutoScroll = () => {
    const newTimeoutId = setTimeout(() => {
      setIsAutoScrolling(true);
      startAutoScroll();
    }, 10000); // 10 seconds

    setTimeoutId(newTimeoutId);
  };

  // Start auto-scroll when component mounts
  useEffect(() => {
    if (isAutoScrolling) {
      startAutoScroll();
    }
    return () => {
      clearTimeout(timeoutId); // Clean up timeout on unmount
      scrollY.stopAnimation(); // Stop animation on unmount
    };
  }, [isAutoScrolling]);

  // Listener to update ScrollView position
  useEffect(() => {
    scrollY.addListener(({ value }) => {
      if (scrollViewRef.current && isAutoScrolling) {
        scrollViewRef.current.scrollTo({ y: value, animated: false });
      }
    });

    return () => scrollY.removeAllListeners(); // Clean up listeners on unmount
  }, [isAutoScrolling]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.TopBar}>
        <View
          style={[
            { borderRadius: 10, marginRight: 10 },
            { backgroundColor: Colors[routeNo] || Colors.TDefault },
          ]}
        >
          <Text
            style={{
              color: "white",
              padding: 5,
              fontSize: 50,
              paddingHorizontal: 10,
            }}
          >
            {routeNo}
          </Text>
        </View>
        <View style={{ width: "80%" }}>
          <Text
            style={{
              color: "white",
              fontSize: 30,
              marginLeft: 10,
              flex: 1,
              flexWrap: "wrap",
              flexShrink: 1,
              maxWidth: screenWidth - 120,
              textAlignVertical: "center",
            }}
            numberOfLines={2}
          >
            {stationName}
          </Text>
        </View>
      </View>
      <View style={styles.horizontalLine} />
      <View style={styles.middleBar}>
        <ScrollView
          style={styles.stations}
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScrollBeginDrag={() => {
            stopAutoScroll();
          }}
          onScrollEndDrag={() => {
            restartAutoScroll();
          }}
        >
          {stops && stops.length > 0 && (
            <View style={styles.stopsContainer}>
              {stops
                .filter(
                  (stop, index) =>
                    index === 0 ||
                    (stop.arrivalTime &&
                      stop.arrivalTime !== "-" &&
                      stop.name !== "N/A")
                )
                .map((stop, stopIndex) => (
                  <View key={stopIndex} style={styles.stop}>
                    <Text style={styles.stopText}>
                      {stop.name.split(",")[0] || "-"}
                    </Text>
                    <View style={{ flexDirection: "row" }}>
                      <Text style={styles.stopInfo}>
                        {stop.name.split(",")[1]}{" "}
                      </Text>
                    </View>
                  </View>
                ))}
            </View>
          )}
        </ScrollView>
        <View
          style={{ flexDirection: "column", justifyContent: "space-between" }}
        >
          <View style={styles.platform}>
            <Text style={styles.platformTitle}>Platform</Text>
            <Text style={styles.platformText}>{platformNo[2]}</Text>
          </View>
          <View>
            <TouchableOpacity>
              <MaterialCommunityIcons
                name="map-outline"
                size={50}
                color="#FFFFFF"
                style={{
                  marginLeft: 10,
                  marginBottom: 10,
                  alignSelf: "flex-end",
                }}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View style={styles.horizontalLine} />
      <View style={styles.bottomBar}>
        <View style={styles.departTime}>
          <Text style={styles.bottomText}>Departs</Text>
          <Text style={styles.bottomTime}>{departTime}</Text>
        </View>
        <Text style={styles.bottomDuration}>{travelTime}</Text>
        <View style={styles.arriveTime}>
          <Text style={[styles.bottomText, { textAlign: "right" }]}>
            Arrives
          </Text>
          <Text style={styles.bottomTime}>{arrivalTime}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "black",
    width: "100%",
    height: screenHeight,
  },
  TopBar: {
    flexDirection: "row",
    margin: 20,
    alignItems: "center",
  },
  horizontalLine: {
    width: "100%", // Set width as a percentage or fixed value
    height: 1, // Set the height to create a thin line
    backgroundColor: "#FFFF", // Choose the line color
    marginVertical: 10,
  },
  middleBar: {
    flexDirection: "row",
    marginHorizontal: 20,
    justifyContent: "space-between",
    height: screenHeight - 390,
  },
  stations: {
    width: "100%",
  },
  stationText: {
    color: "white",
    fontSize: 30,
    marginVertical: 20,
  },
  platform: {
    marginVertical: 20,
  },
  platformTitle: {
    color: "white",
    fontSize: 20,
  },
  platformText: {
    color: "white",
    fontSize: 50,
    textAlign: "right",
  },
  stop: {
    marginVertical: 10,
  },
  stopText: {
    color: "white",
    fontSize: 20,
  },
  stopInfo: {
    color: "white",
    flexWrap: "wrap",
    maxWidth: "100%",
  },
  bottomBar: {
    width: "100%",
    flexDirection: "row",
    height: 100,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  bottomText: {
    color: "white",
    fontSize: 20,
  },
  bottomTime: {
    color: "white",
    fontSize: 40,
  },
  bottomDuration: {
    color: "white",
    fontSize: 20,
    textAlign: "center",
  },
});

export default JourneyDetails;

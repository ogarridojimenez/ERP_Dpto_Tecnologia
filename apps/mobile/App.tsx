import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./src/screens/HomeScreen";
import ScanScreen from "./src/screens/ScanScreen";
import QrScannerScreen from "./src/screens/QrScannerScreen";
import LocalAssetsScreen from "./src/screens/LocalAssetsScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Scan" component={ScanScreen} />
        <Stack.Screen
          name="QrScanner"
          component={QrScannerScreen}
          options={{ presentation: "fullScreenModal" }}
        />
        <Stack.Screen name="LocalAssets" component={LocalAssetsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

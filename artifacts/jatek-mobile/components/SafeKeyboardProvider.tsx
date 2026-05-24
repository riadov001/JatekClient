import React from "react";
import Constants from "expo-constants";

const isExpoGo = Constants.appOwnership === "expo";

let NativeKeyboardProvider: React.ComponentType<{ children: React.ReactNode }> | null = null;
if (!isExpoGo) {
  try {
    NativeKeyboardProvider =
      require("react-native-keyboard-controller").KeyboardProvider;
  } catch {
    NativeKeyboardProvider = null;
  }
}

export function SafeKeyboardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!NativeKeyboardProvider) return <>{children}</>;
  return <NativeKeyboardProvider>{children}</NativeKeyboardProvider>;
}

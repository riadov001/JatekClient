import React from "react";
import { Platform, ScrollView, ScrollViewProps } from "react-native";
import Constants from "expo-constants";

const isExpoGo = Constants.appOwnership === "expo";

let NativeKeyboardAwareScrollView: React.ComponentType<any> | null = null;
if (Platform.OS !== "web" && !isExpoGo) {
  try {
    NativeKeyboardAwareScrollView =
      require("react-native-keyboard-controller").KeyboardAwareScrollView;
  } catch {
    NativeKeyboardAwareScrollView = null;
  }
}

type Props = ScrollViewProps & {
  keyboardShouldPersistTaps?: "always" | "handled" | "never";
  [key: string]: any;
};

export function KeyboardAwareScrollViewCompat({
  children,
  keyboardShouldPersistTaps = "handled",
  ...props
}: Props) {
  if (!NativeKeyboardAwareScrollView) {
    return (
      <ScrollView keyboardShouldPersistTaps={keyboardShouldPersistTaps} {...props}>
        {children}
      </ScrollView>
    );
  }
  return (
    <NativeKeyboardAwareScrollView
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      {...props}
    >
      {children}
    </NativeKeyboardAwareScrollView>
  );
}

"use client";

import { useState, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Text, TextInput, Button } from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { ArrowLeft } from "react-native-feather";
import { useAppDispatch } from "../../store/hooks";
import { setMockUser } from "../../store/slices/authSlice";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { app } from "../../api/firebase/config";
import { sendVerificationCode } from "../../services/AuthService";

const PhoneAuthScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [isLoading, setIsLoading] = useState(false);
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);

  const handleSendOTP = async () => {
    if (phoneNumber.trim().length < 6) {
      Alert.alert("Invalid Phone Number", "Please enter a valid phone number");
      return;
    }

    const fullPhoneNumber = `${countryCode}${phoneNumber}`;
    setIsLoading(true);

    try {
      // Use the AuthService directly instead of dispatching an action
      const result = await sendVerificationCode(
        fullPhoneNumber,
        recaptchaVerifier
      );

      setIsLoading(false);
      navigation.navigate("OTPVerification", {
        phoneNumber: fullPhoneNumber,
        verificationId: result.verificationId,
      });
    } catch (error: any) {
      setIsLoading(false);
      Alert.alert("Error", error.message || "Failed to send verification code");
      console.error("Failed to send OTP:", error);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  // For development only - bypass authentication
  const handleBypassAuth = () => {
    dispatch(
      setMockUser({
        id: "mock-user-id",
        phoneNumber: `${countryCode}${phoneNumber || "1234567890"}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={app.options}
        attemptInvisibleVerification={false}
      />

      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <ArrowLeft width={24} height={24} stroke={theme.colors.onBackground} />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.primary }]}>
          Enter Your Phone Number
        </Text>

        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          We'll send you a verification code to confirm your identity
        </Text>

        <View style={styles.phoneInputContainer}>
          <TextInput
            style={styles.countryCodeInput}
            mode="outlined"
            label="Code"
            value={countryCode}
            onChangeText={setCountryCode}
            keyboardType="phone-pad"
          />

          <TextInput
            style={styles.phoneInput}
            mode="outlined"
            label="Phone Number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
        </View>

        <Button
          mode="contained"
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          loading={isLoading}
          disabled={isLoading || phoneNumber.trim().length < 6}
          onPress={handleSendOTP}
        >
          Send Verification Code
        </Button>

        {/* Development only button - remove in production */}
        <Button mode="text" style={styles.devButton} onPress={handleBypassAuth}>
          [DEV] Skip Authentication
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  backButton: {
    marginTop: 40,
    marginBottom: 16,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  phoneInputContainer: {
    flexDirection: "row",
    marginBottom: 24,
  },
  countryCodeInput: {
    width: 80,
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
  },
  button: {
    marginTop: 8,
    paddingVertical: 8,
  },
  devButton: {
    marginTop: 16,
  },
});

export default PhoneAuthScreen;

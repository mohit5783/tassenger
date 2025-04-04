"use client";

import { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Text, TextInput, Button } from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppDispatch } from "../../store/hooks";
import { verifyOTP, setMockUser } from "../../store/slices/authSlice";
import { ArrowLeft } from "react-native-feather";

const OTPVerificationScreen = ({ navigation, route }: any) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { phoneNumber, verificationId } = route.params;

  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      Alert.alert("Invalid Code", "Please enter a valid 6-digit code");
      return;
    }

    setIsLoading(true);

    try {
      // Real Firebase OTP verification
      await dispatch(verifyOTP({ verificationId, otp })).unwrap();
      setIsLoading(false);
      // Navigation will be handled by the auth state listener in RootNavigator
    } catch (error: any) {
      setIsLoading(false);
      Alert.alert("Error", error.message || "Failed to verify code");
      console.error("Failed to verify OTP:", error);
    }
  };

  const handleResendOTP = () => {
    // In a real app, you would navigate back to PhoneAuthScreen or implement resend logic
    navigation.goBack();
  };

  const handleBack = () => {
    navigation.goBack();
  };

  // For development only - bypass authentication
  const handleBypassAuth = () => {
    dispatch(
      setMockUser({
        id: "mock-user-id",
        phoneNumber: phoneNumber,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <ArrowLeft width={24} height={24} stroke={theme.colors.onBackground} />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.primary }]}>
          Verification Code
        </Text>

        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          We've sent a verification code to {phoneNumber}
        </Text>

        <TextInput
          style={styles.otpInput}
          mode="outlined"
          label="Enter 6-digit code"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
        />

        <Button
          mode="contained"
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          loading={isLoading}
          disabled={isLoading || otp.length !== 6}
          onPress={handleVerifyOTP}
        >
          Verify
        </Button>

        <View style={styles.resendContainer}>
          <Text style={{ color: theme.colors.textSecondary }}>
            Didn't receive the code?
          </Text>

          {canResend ? (
            <TouchableOpacity onPress={handleResendOTP}>
              <Text style={{ color: theme.colors.primary, marginLeft: 4 }}>
                Resend Code
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={{ color: theme.colors.textSecondary, marginLeft: 4 }}>
              Resend in {timer}s
            </Text>
          )}
        </View>

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
  otpInput: {
    marginBottom: 24,
  },
  button: {
    marginTop: 8,
    paddingVertical: 8,
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  devButton: {
    marginTop: 16,
  },
});

export default OTPVerificationScreen;

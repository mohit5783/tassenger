"use client";

import { useState, useRef, useEffect } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Text, Button, TextInput, HelperText } from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppDispatch } from "../../store/hooks";
import { updateUserProfile } from "../../store/slices/authSlice";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { app } from "../../api/firebase/config";
import { PhoneAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "../../api/firebase/config";

const PhoneVerificationScreen = ({ navigation, route }: any) => {
  const { phoneNumber, userId } = route.params;
  const { theme } = useTheme();
  const dispatch = useAppDispatch();

  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [codeError, setCodeError] = useState("");

  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);

  useEffect(() => {
    sendVerificationCode();
  }, []);

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

  const sendVerificationCode = async () => {
    if (!recaptchaVerifier.current) return;

    setIsSendingCode(true);
    try {
      const provider = new PhoneAuthProvider(auth);
      const verificationId = await provider.verifyPhoneNumber(
        phoneNumber,
        recaptchaVerifier.current
      );
      setVerificationId(verificationId);
      Alert.alert(
        "Verification Code Sent",
        `We've sent a verification code to ${phoneNumber}`
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send verification code");
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleResendCode = () => {
    setCanResend(false);
    setTimer(60);
    sendVerificationCode();
  };

  const validateCode = () => {
    if (!verificationCode.trim()) {
      setCodeError("Verification code is required");
      return false;
    }

    if (verificationCode.length !== 6) {
      setCodeError("Please enter a valid 6-digit code");
      return false;
    }

    setCodeError("");
    return true;
  };

  const handleVerifyCode = async () => {
    if (!validateCode() || !verificationId) return;

    setIsLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(
        verificationId,
        verificationCode
      );
      await signInWithCredential(auth, credential);

      // Update user profile to mark phone as verified
      await dispatch(
        updateUserProfile({
          userId,
          data: {
            isPhoneVerified: true,
            phoneVerifiedAt: Date.now(),
          },
        })
      ).unwrap();

      Alert.alert("Success", "Your phone number has been verified", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert(
        "Verification Failed",
        error.message || "Please check your code and try again"
      );
    } finally {
      setIsLoading(false);
    }
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

      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.primary }]}>
          Verify Your Phone
        </Text>

        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Enter the 6-digit code sent to {phoneNumber}
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            mode="outlined"
            label="Verification Code"
            value={verificationCode}
            onChangeText={setVerificationCode}
            keyboardType="number-pad"
            maxLength={6}
            error={!!codeError}
            disabled={isLoading}
          />
          {!!codeError && <HelperText type="error">{codeError}</HelperText>}
        </View>

        <Button
          mode="contained"
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          loading={isLoading}
          disabled={isLoading || !verificationCode.trim()}
          onPress={handleVerifyCode}
        >
          Verify
        </Button>

        <View style={styles.resendContainer}>
          <Text style={{ color: theme.colors.textSecondary }}>
            Didn't receive the code?
          </Text>

          {canResend ? (
            <Button
              mode="text"
              onPress={handleResendCode}
              loading={isSendingCode}
              disabled={isSendingCode}
            >
              Resend Code
            </Button>
          ) : (
            <Text style={{ color: theme.colors.textSecondary, marginTop: 8 }}>
              Resend in {timer}s
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: "center",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 24,
  },
  input: {
    width: "100%",
  },
  button: {
    width: "100%",
    paddingVertical: 8,
    marginBottom: 24,
  },
  resendContainer: {
    alignItems: "center",
  },
});

export default PhoneVerificationScreen;

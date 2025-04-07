"use client";

import { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Text, TextInput, Button, HelperText } from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { ArrowLeft } from "react-native-feather";
import { useAppDispatch } from "../../store/hooks";
import { signIn, signUp } from "../../store/slices/authSlice";

const EmailAuthScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Validation states
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [displayNameError, setDisplayNameError] = useState("");
  const [phoneNumberError, setPhoneNumberError] = useState("");

  const validateEmail = () => {
    if (!email) {
      setEmailError("Email is required");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    }

    setEmailError("");
    return true;
  };

  const validatePassword = () => {
    if (!password) {
      setPasswordError("Password is required");
      return false;
    }

    if (isSignUp && password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return false;
    }

    setPasswordError("");
    return true;
  };

  const validateDisplayName = () => {
    if (isSignUp && !displayName) {
      setDisplayNameError("Name is required");
      return false;
    }

    setDisplayNameError("");
    return true;
  };

  const validatePhoneNumber = () => {
    if (isSignUp && !phoneNumber) {
      setPhoneNumberError("Phone number is required");
      return false;
    }

    // Basic phone number validation - only numbers allowed
    if (isSignUp && !/^\d+$/.test(phoneNumber)) {
      setPhoneNumberError("Phone number should contain only digits");
      return false;
    }

    // Check for reasonable length (adjust as needed for your target regions)
    if (isSignUp && (phoneNumber.length < 10 || phoneNumber.length > 15)) {
      setPhoneNumberError("Please enter a valid phone number (10-15 digits)");
      return false;
    }

    setPhoneNumberError("");
    return true;
  };

  const handleAuth = async () => {
    // Validate all fields
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    const isDisplayNameValid = validateDisplayName();
    const isPhoneNumberValid = validatePhoneNumber();

    if (
      !isEmailValid ||
      !isPasswordValid ||
      (isSignUp && (!isDisplayNameValid || !isPhoneNumberValid))
    ) {
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        // Combine country code and phone number
        const fullPhoneNumber = `${countryCode}${phoneNumber.replace(
          /\D/g,
          ""
        )}`;

        await dispatch(
          signUp({
            email,
            password,
            displayName,
            phoneNumber: fullPhoneNumber, // Use the full phone number with country code
            hasCompletedProfile: false, // Mark as incomplete to redirect to profile edit
          })
        ).unwrap();
        Alert.alert(
          "Success",
          "Account created successfully! You can now sign in."
        );
        setIsSignUp(false);
      } else {
        await dispatch(signIn({ email, password })).unwrap();
        // No need to navigate - the auth state listener will handle it
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      // Check if the error is related to phone number validation
      if (
        error.message &&
        error.message.includes("phone number is already registered")
      ) {
        Alert.alert(
          "Phone Number Already Registered",
          "This phone number is already linked to an account. Please use a different phone number.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          isSignUp ? "Sign Up Failed" : "Sign In Failed",
          error.message || "Please check your credentials and try again"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft
            width={24}
            height={24}
            stroke={theme.colors.onBackground}
          />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.colors.primary }]}>
            {isSignUp ? "Create an Account" : "Sign In"}
          </Text>

          <Text
            style={[styles.subtitle, { color: theme.colors.textSecondary }]}
          >
            {isSignUp
              ? "Create a new account to get started"
              : "Sign in to your account to continue"}
          </Text>

          {isSignUp && (
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                mode="outlined"
                label="Full Name"
                value={displayName}
                onChangeText={setDisplayName}
                onBlur={validateDisplayName}
                error={!!displayNameError}
                disabled={isLoading}
              />
              {!!displayNameError && (
                <HelperText type="error">{displayNameError}</HelperText>
              )}
            </View>
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              mode="outlined"
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              onBlur={validateEmail}
              error={!!emailError}
              disabled={isLoading}
            />
            {!!emailError && <HelperText type="error">{emailError}</HelperText>}
          </View>

          {isSignUp && (
            <View style={styles.inputContainer}>
              <Text
                style={[
                  styles.phoneLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Phone Number
              </Text>
              <View style={styles.phoneContainer}>
                <TextInput
                  style={styles.countryCodeInput}
                  mode="outlined"
                  label="Code"
                  value={countryCode}
                  onChangeText={setCountryCode}
                  keyboardType="phone-pad"
                  disabled={isLoading}
                />
                <TextInput
                  style={styles.phoneInput}
                  mode="outlined"
                  label="Phone Number"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  onBlur={validatePhoneNumber}
                  error={!!phoneNumberError}
                  disabled={isLoading}
                />
              </View>
              {!!phoneNumberError && (
                <HelperText type="error">{phoneNumberError}</HelperText>
              )}
            </View>
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              mode="outlined"
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              onBlur={validatePassword}
              error={!!passwordError}
              disabled={isLoading}
            />
            {!!passwordError && (
              <HelperText type="error">{passwordError}</HelperText>
            )}
          </View>

          <Button
            mode="contained"
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            loading={isLoading}
            disabled={isLoading}
            onPress={handleAuth}
          >
            {isSignUp ? "Sign Up" : "Sign In"}
          </Button>

          <TouchableOpacity
            style={styles.switchModeButton}
            onPress={() => setIsSignUp(!isSignUp)}
            disabled={isLoading}
          >
            <Text style={{ color: theme.colors.primary }}>
              {isSignUp
                ? "Already have an account? Sign In"
                : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    width: "100%",
  },
  phoneLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  phoneContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  countryCodeInput: {
    width: "25%",
    marginRight: 8,
  },
  phoneInput: {
    width: "72%",
  },
  button: {
    marginTop: 8,
    paddingVertical: 8,
  },
  switchModeButton: {
    marginTop: 16,
    alignItems: "center",
  },
});

export default EmailAuthScreen;

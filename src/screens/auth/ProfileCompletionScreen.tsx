"use client";

import { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { Text, TextInput, Button, Avatar } from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { updateUserProfile } from "../../store/slices/authSlice";
import { checkPhoneInContacts } from "../../services/ContactsService";

const ProfileCompletionScreen = ({ navigation, route }: any) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { userId, isNewUser } = route.params;
  const { user, isLoading } = useAppSelector((state) => state.auth);

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [countryCode, setCountryCode] = useState("+91");
  const [contactsPermissionRequested, setContactsPermissionRequested] =
    useState(false);

  useEffect(() => {
    if (user?.phoneNumber) {
      // Extract country code and phone number if already exists
      const match = user.phoneNumber.match(/^(\+\d+)(\d+)$/);
      if (match) {
        setCountryCode(match[1]);
        setPhoneNumber(match[2]);
      } else {
        setPhoneNumber(user.phoneNumber);
      }
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }

    if (!phoneNumber.trim()) {
      Alert.alert("Error", "Please enter your phone number");
      return;
    }

    const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/\D/g, "")}`;

    try {
      // Check if phone exists in contacts for soft verification
      let isPhoneInContacts = false;
      if (!contactsPermissionRequested) {
        isPhoneInContacts = await checkPhoneInContacts(fullPhoneNumber);
        setContactsPermissionRequested(true);
      }

      // Update user profile with phone number and mark profile as complete
      await dispatch(
        updateUserProfile({
          userId,
          data: {
            displayName,
            phoneNumber: fullPhoneNumber,
            isPhoneVerified: isPhoneInContacts, // Soft verification if in contacts
            hasCompletedProfile: true,
          },
        })
      ).unwrap();

      // If this is a new user, we might want to show an onboarding screen
      // For now, the RootNavigator will handle navigation to the main app
    } catch (error) {
      console.error("Failed to update profile:", error);
      Alert.alert("Error", "Failed to save profile information");
    }
  };

  const handleVerifyPhone = () => {
    if (!phoneNumber.trim()) {
      Alert.alert("Error", "Please enter your phone number");
      return;
    }

    const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/\D/g, "")}`;

    // Navigate to phone verification screen
    navigation.navigate("PhoneAuth", {
      phoneNumber: fullPhoneNumber,
      userId,
      returnScreen: "ProfileCompletion",
    });
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.primary }]}>
            {isNewUser ? "Complete Your Profile" : "Update Your Profile"}
          </Text>
          <Text
            style={[styles.subtitle, { color: theme.colors.textSecondary }]}
          >
            {isNewUser
              ? "Please provide your information to get started"
              : "Please update your information"}
          </Text>
        </View>

        <View style={styles.avatarContainer}>
          <Avatar.Text
            size={80}
            label={displayName ? displayName[0].toUpperCase() : "?"}
            style={{ backgroundColor: theme.colors.primary }}
          />
        </View>

        <TextInput
          style={styles.input}
          mode="outlined"
          label="Full Name"
          value={displayName}
          onChangeText={setDisplayName}
        />

        <View style={styles.phoneContainer}>
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

        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          Your phone number helps us connect you with your contacts who are
          already using Tassenger.
        </Text>

        <Button
          mode="text"
          onPress={handleVerifyPhone}
          style={styles.verifyButton}
        >
          Verify phone number with OTP (optional)
        </Button>

        <Button
          mode="contained"
          style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
          loading={isLoading}
          disabled={isLoading || !displayName.trim() || !phoneNumber.trim()}
          onPress={handleSaveProfile}
        >
          {isNewUser ? "Complete Profile" : "Save Changes"}
        </Button>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  phoneContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  countryCodeInput: {
    width: 80,
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 24,
  },
  verifyButton: {
    marginBottom: 16,
  },
  saveButton: {
    marginTop: 8,
    paddingVertical: 8,
  },
});

export default ProfileCompletionScreen;

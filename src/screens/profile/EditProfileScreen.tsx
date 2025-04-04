"use client";

import { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  TextInput,
  Button,
  Avatar,
  Appbar,
  SegmentedButtons,
  Text,
  Divider,
} from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { updateUserProfile } from "../../store/slices/authSlice";
import { Camera, Phone } from "react-native-feather";
import * as ImagePicker from "expo-image-picker";

const EditProfileScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAppSelector((state) => state.auth);

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [salutation, setSalutation] = useState(user?.salutation || "");
  const [sex, setSex] = useState(user?.sex || "");
  const [occupation, setOccupation] = useState(user?.occupation || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [photoURL, setPhotoURL] = useState(user?.photoURL || "");

  // Get the appropriate default avatar based on sex
  const getDefaultAvatar = () => {
    if (!sex || sex === "prefer_not_to_say") {
      return require("../../../assets/default-avatar.png");
    } else if (sex === "male") {
      return require("../../../assets/default-male-avatar.png");
    } else if (sex === "female") {
      return require("../../../assets/default-female-avatar.png");
    }
    return require("../../../assets/default-avatar.png");
  };

  const handlePickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "You need to grant access to your photo library to change your profile picture."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhotoURL(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      await dispatch(
        updateUserProfile({
          userId: user.id,
          data: {
            displayName,
            email,
            salutation,
            sex,
            occupation,
            bio,
            photoURL,
            hasCompletedProfile: true, // Mark profile as completed
          },
        })
      ).unwrap();

      navigation.goBack();
    } catch (error) {
      console.error("Failed to update profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <Appbar.Header style={{ backgroundColor: "black" }}>
        <Appbar.BackAction
          color="white"
          onPress={() => navigation.goBack()}
        />
        <Appbar.Content title="Edit Profile" color="white"
 />
      </Appbar.Header>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.formCard,
            { backgroundColor: theme.dark ? "#1E1E1E" : "white" },
          ]}
        >
          <View style={styles.avatarContainer}>
            <Avatar.Image
              size={100}
              source={photoURL ? { uri: photoURL } : getDefaultAvatar()}
            />
            <TouchableOpacity
              style={[
                styles.cameraButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={handlePickImage}
            >
              <Camera width={20} height={20} stroke={theme.colors.onPrimary} />
            </TouchableOpacity>
          </View>

          {/* Phone number displayed as a label below profile pic */}
          {user?.phoneNumber && (
            <View style={styles.phoneContainer}>
              <Phone
                width={16}
                height={16}
                stroke={theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.phoneText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {user.phoneNumber}
              </Text>
            </View>
          )}

          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            Personal Information
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.inputShort}
              mode="outlined"
              label="Salutation"
              value={salutation}
              onChangeText={setSalutation}
              placeholder="Mr./Ms./Dr."
            />

            <TextInput
              style={styles.inputLong}
              mode="outlined"
              label="Full Name"
              value={displayName}
              onChangeText={setDisplayName}
            />
          </View>

          <Text
            style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}
          >
            Sex
          </Text>
          <SegmentedButtons
            value={sex}
            onValueChange={setSex}
            buttons={[
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
              { value: "prefer_not_to_say", label: "Prefer not to say" },
            ]}
            style={styles.segmentedButtons}
          />

          <TextInput
            style={styles.input}
            mode="outlined"
            label="Occupation"
            value={occupation}
            onChangeText={setOccupation}
          />

          <TextInput
            style={styles.input}
            mode="outlined"
            label="Email (Optional)"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <Divider style={styles.divider} />

          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            About Me
          </Text>

          <TextInput
            style={styles.bioInput}
            mode="outlined"
            label="Bio"
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            placeholder="Tell us a bit about yourself..."
          />

          <Button
            mode="contained"
            style={[
              styles.saveButton,
              { backgroundColor: theme.colors.primary },
            ]}
            loading={isLoading}
            disabled={isLoading || !displayName.trim()}
            onPress={handleSave}
          >
            Save Changes
          </Button>

          {/* Add extra padding at the bottom to ensure content is visible above keyboard */}
          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40, // Add padding to ensure content is visible
  },
  formCard: {
    margin: 8,
    padding: 16,
    borderRadius: 8,
  },
  avatarContainer: {
    alignItems: "center",
    marginVertical: 24,
    position: "relative",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: "35%",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  phoneText: {
    fontSize: 16,
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  inputShort: {
    width: "30%",
  },
  inputLong: {
    width: "65%",
  },
  input: {
    marginBottom: 16,
  },
  bioInput: {
    marginBottom: 16,
    height: 120,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  saveButton: {
    marginTop: 8,
    paddingVertical: 8,
  },
  bottomPadding: {
    height: 100, // Extra padding at the bottom
  },
});

export default EditProfileScreen;

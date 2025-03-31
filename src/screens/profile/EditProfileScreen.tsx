"use client"

import { useState } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native"
import { TextInput, Button, Avatar, Appbar } from "react-native-paper"
import { useTheme } from "../../theme/ThemeProvider"
import { useAppDispatch, useAppSelector } from "../../store/hooks"
import { updateUserProfile } from "../../store/slices/authSlice"
import { Camera } from "react-native-feather"

const EditProfileScreen = ({ navigation }: any) => {
  const { theme } = useTheme()
  const dispatch = useAppDispatch()
  const { user, isLoading } = useAppSelector((state) => state.auth)

  const [displayName, setDisplayName] = useState(user?.displayName || "")
  const [email, setEmail] = useState(user?.email || "")

  const handleSave = async () => {
    if (!user) return

    try {
      await dispatch(
        updateUserProfile({
          userId: user.id,
          data: {
            displayName,
            email,
          },
        }),
      ).unwrap()

      navigation.goBack()
    } catch (error) {
      console.error("Failed to update profile:", error)
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.BackAction color={theme.colors.onPrimary} onPress={() => navigation.goBack()} />
        <Appbar.Content title="Edit Profile" color={theme.colors.onPrimary} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <View style={styles.formCard}>
          <View style={styles.avatarContainer}>
            <Avatar.Image
              size={100}
              source={user?.photoURL ? { uri: user.photoURL } : require("../../../assets/default-avatar.png")}
            />
            <TouchableOpacity style={[styles.cameraButton, { backgroundColor: theme.colors.primary }]}>
              <Camera width={20} height={20} stroke={theme.colors.onPrimary} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            mode="outlined"
            label="Display Name"
            value={displayName}
            onChangeText={setDisplayName}
          />

          <TextInput
            style={styles.input}
            mode="outlined"
            label="Email (Optional)"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            mode="outlined"
            label="Phone Number"
            value={user?.phoneNumber || ""}
            disabled
          />

          <Button
            mode="contained"
            style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
            loading={isLoading}
            disabled={isLoading || !displayName.trim()}
            onPress={handleSave}
          >
            Save Changes
          </Button>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  formCard: {
    backgroundColor: "white",
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
  input: {
    marginBottom: 16,
  },
  saveButton: {
    marginTop: 8,
    paddingVertical: 8,
  },
})

export default EditProfileScreen


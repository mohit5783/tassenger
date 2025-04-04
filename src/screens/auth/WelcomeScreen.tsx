"use client";
import { View, StyleSheet } from "react-native";
import { Text, Button } from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";

const WelcomeScreen = ({ navigation }: any) => {
  const { theme } = useTheme();

  const handleEmailAuth = () => {
    navigation.navigate("EmailAuth");
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.logoContainer}>
        <View style={[styles.logo, { backgroundColor: theme.colors.primary }]}>
          <Text style={[styles.logoText, { color: theme.colors.onPrimary }]}>
            T
          </Text>
        </View>
        <Text style={[styles.appName, { color: theme.colors.primary }]}>
          Tassenger
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Welcome to Tassenger
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Your task management and messaging app
        </Text>

        <View style={styles.authOptions}>
          <Button
            mode="contained"
            icon="email"
            style={[
              styles.authButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={handleEmailAuth}
          >
            Continue with Email
          </Button>

          {/* Google sign-in will be implemented later */}
          {/* <Button mode="outlined" icon="google" style={styles.authButton} onPress={handleGoogleSignIn}>
           Continue with Google
         </Button> */}
        </View>

        <Text style={[styles.termsText, { color: theme.colors.textSecondary }]}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    fontSize: 40,
    fontWeight: "bold",
  },
  appName: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
    textAlign: "center",
  },
  authOptions: {
    width: "100%",
    marginBottom: 24,
  },
  authButton: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  termsText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 16,
  },
});

export default WelcomeScreen;

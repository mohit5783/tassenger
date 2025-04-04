import type React from "react";
import { View, StyleSheet, type ViewStyle, type StyleProp } from "react-native";
import { Check } from "react-native-feather";

interface ReadReceiptProps {
  status: "sent" | "delivered" | "read";
  size?: number;
  color?: string;
  readColor?: string;
  style?: StyleProp<ViewStyle>;
}

const ReadReceipt: React.FC<ReadReceiptProps> = ({
  status,
  size = 16,
  color = "#8E8E93",
  readColor = "#34B7F1",
  style,
}) => {
  // For 'sent', we show a single check
  if (status === "sent") {
    return (
      <View style={style}>
        <Check width={size} height={size} stroke={color} />
      </View>
    );
  }

  // For 'delivered' and 'read', we show double checks
  return (
    <View style={[styles.container, style]}>
      {/* First check mark */}
      <View
        style={[styles.checkmark, { transform: [{ translateX: size * 0.2 }] }]}
      >
        <Check
          width={size}
          height={size}
          stroke={status === "read" ? readColor : color}
        />
      </View>

      {/* Second check mark */}
      <View
        style={[styles.checkmark, { transform: [{ translateX: -size * 0.2 }] }]}
      >
        <Check
          width={size}
          height={size}
          stroke={status === "read" ? readColor : color}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    position: "relative",
  },
});

export default ReadReceipt;

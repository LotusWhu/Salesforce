import { PropsWithChildren } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

export const colors = {
  brand: "#f7492f",
  brandDark: "#b52c18",
  brandLight: "#fff1f0",
  text: "#1a1a1a",
  subtext: "#6b6b6b",
  border: "#e5e5e5",
  bg: "#fafafa",
  white: "#ffffff",
};

export function Screen({ children }: PropsWithChildren) {
  return <View style={styles.screen}>{children}</View>;
}

export function Card({ children, style }: PropsWithChildren<{ style?: object }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Badge({ label }: { label: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  disabled,
  loading,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      style={[styles.primaryBtn, disabled && styles.btnDisabled]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{title}</Text>}
    </Pressable>
  );
}

export function SecondaryButton({
  title,
  onPress,
  active,
  disabled,
}: {
  title: string;
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={[styles.secondaryBtn, active && styles.secondaryBtnActive, disabled && styles.btnDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.secondaryBtnText, active && styles.secondaryBtnTextActive]}>{title}</Text>
    </Pressable>
  );
}

export function Field({ label, children }: PropsWithChildren<{ label: string }>) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

export function TextField(props: TextInputProps) {
  return <TextInput style={styles.input} placeholderTextColor="#a3a3a3" {...props} />;
}

export function ErrorText({ children }: PropsWithChildren) {
  if (!children) return null;
  return <Text style={styles.error}>{children}</Text>;
}

export function SuccessText({ children }: PropsWithChildren) {
  if (!children) return null;
  return <Text style={styles.success}>{children}</Text>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.brandLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { color: colors.brandDark, fontSize: 12, fontWeight: "600" },
  primaryBtn: {
    backgroundColor: colors.brand,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
  },
  secondaryBtnActive: { borderColor: colors.brand },
  secondaryBtnText: { color: colors.text, fontSize: 13, fontWeight: "600" },
  secondaryBtnTextActive: { color: colors.brandDark },
  btnDisabled: { opacity: 0.5 },
  field: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: "600", color: colors.subtext, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: colors.white,
    color: colors.text,
  },
  error: { color: "#dc2626", fontSize: 13, marginTop: 4 },
  success: { color: "#16a34a", fontSize: 13, marginTop: 4 },
});

import { Image, StyleSheet, View } from "react-native";

export default function PhotoGallery({ urls }: { urls: string[] }) {
  if (!urls || urls.length === 0) return null;
  return (
    <View style={styles.row}>
      {urls.map((url) => (
        <Image key={url} source={{ uri: url }} style={styles.thumb} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  thumb: { width: 96, height: 96, borderRadius: 10 },
});

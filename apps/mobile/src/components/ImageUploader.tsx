import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ALLOWED_IMAGE_MIME_TYPES, MAX_UPLOAD_SIZE_BYTES, UploadResponseDto } from "@localhub/shared-types";
import { api, ApiError, PickedFile } from "@/lib/api";
import { colors } from "./ui";

const MAX_MB = MAX_UPLOAD_SIZE_BYTES / 1024 / 1024;

function extToMimeType(uri: string): string {
  const ext = uri.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  return "image/jpeg";
}

export default function ImageUploader({
  urls,
  onChange,
  max = 9,
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async () => {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("需要相册权限才能选择图片");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: Math.max(1, max - urls.length),
      quality: 0.9,
    });
    if (result.canceled) return;

    setUploading(true);
    const next = [...urls];
    for (const asset of result.assets) {
      const mimeType = asset.mimeType ?? extToMimeType(asset.uri);
      if (!ALLOWED_IMAGE_MIME_TYPES.includes(mimeType)) {
        setError("仅支持 jpg/png 图片");
        continue;
      }
      if (asset.fileSize && asset.fileSize > MAX_UPLOAD_SIZE_BYTES) {
        setError(`文件超过 ${MAX_MB}MB 限制`);
        continue;
      }
      const file: PickedFile = { uri: asset.uri, name: asset.fileName ?? `photo.${mimeType === "image/png" ? "png" : "jpg"}`, type: mimeType };
      try {
        const res = await api.upload<UploadResponseDto>("/uploads", file);
        next.push(res.url);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "上传失败，请重试");
      }
    }
    onChange(next);
    setUploading(false);
  };

  const removeAt = (idx: number) => onChange(urls.filter((_, i) => i !== idx));

  return (
    <View>
      <View style={styles.row}>
        {urls.map((url, idx) => (
          <View key={url} style={styles.thumbWrap}>
            <Image source={{ uri: url }} style={styles.thumb} />
            <Pressable style={styles.removeBtn} onPress={() => removeAt(idx)}>
              <Text style={styles.removeText}>×</Text>
            </Pressable>
          </View>
        ))}
        {urls.length < max && (
          <Pressable style={styles.addBtn} onPress={pick} disabled={uploading}>
            <Text style={styles.addText}>{uploading ? "上传中..." : "+ 添加图片"}</Text>
          </Pressable>
        )}
      </View>
      <Text style={styles.hint}>
        支持 jpg/png，单张不超过 {MAX_MB}MB，最多 {max} 张
      </Text>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  thumbWrap: { width: 80, height: 80, borderRadius: 10, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
  thumb: { width: "100%", height: "100%" },
  removeBtn: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 20,
    height: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: 6,
  },
  removeText: { color: "#fff", fontSize: 13, lineHeight: 13 },
  addBtn: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  addText: { fontSize: 11, color: colors.subtext, textAlign: "center", paddingHorizontal: 4 },
  hint: { fontSize: 11, color: colors.subtext, marginTop: 6 },
  error: { fontSize: 12, color: "#dc2626", marginTop: 4 },
});

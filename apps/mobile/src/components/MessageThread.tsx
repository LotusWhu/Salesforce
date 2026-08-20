import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { RecordingPresets, requestRecordingPermissionsAsync, useAudioPlayer, useAudioPlayerStatus, useAudioRecorder } from "expo-audio";
import { ConversationContextType, MessageDto } from "@localhub/shared-types";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Card, ErrorText, PrimaryButton, SecondaryButton, TextField, colors } from "./ui";

const AUDIO_EXT = [".m4a", ".mp3", ".webm", ".aac", ".mp4", ".wav"];

function isAudioUrl(url: string) {
  return AUDIO_EXT.some((ext) => url.toLowerCase().endsWith(ext));
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString();
}

function VoiceBubble({ url }: { url: string }) {
  const player = useAudioPlayer(url);
  const status = useAudioPlayerStatus(player);
  return (
    <Pressable
      style={styles.voiceBubble}
      onPress={() => (status.playing ? player.pause() : player.play())}
    >
      <Text style={styles.voiceText}>{status.playing ? "⏸ 暂停" : "▶ 播放语音"}</Text>
    </Pressable>
  );
}

export default function MessageThread({ contextType, contextId }: { contextType: ConversationContextType; contextId: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageDto[] | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const load = () => api.get<MessageDto[]>(`/chat/${contextType}/${contextId}/messages`).then(setMessages);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextType, contextId]);

  useEffect(() => {
    if (user) api.post(`/chat/${contextType}/${contextId}/read`).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, contextType, contextId]);

  const send = async (attachmentUrls?: string[]) => {
    if (!text.trim() && (!attachmentUrls || attachmentUrls.length === 0)) return;
    setError(null);
    setSending(true);
    try {
      await api.post(`/chat/${contextType}/${contextId}/messages`, {
        text: text.trim() || undefined,
        attachmentUrls,
      });
      setText("");
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "发送失败，请重试");
    } finally {
      setSending(false);
    }
  };

  const startRecording = async () => {
    setError(null);
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) {
      setError("需要麦克风权限才能录制语音");
      return;
    }
    await recorder.prepareToRecordAsync();
    recorder.record();
    setRecording(true);
  };

  const stopRecording = async () => {
    await recorder.stop();
    setRecording(false);
    const uri = recorder.uri;
    if (!uri) return;
    setSending(true);
    try {
      const res = await api.upload<{ url: string }>("/uploads", { uri, name: "voice-message.m4a", type: "audio/m4a" });
      await send([res.url]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "语音上传失败");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <Text style={styles.title}>留言区</Text>
      <Text style={styles.hint}>公开留言，所有人可见；请勿在此交换电话号码，站内消息可以完成全部沟通</Text>

      <View style={{ maxHeight: 280 }}>
        {messages === null && <Text style={styles.hint}>加载中...</Text>}
        {messages !== null && messages.length === 0 && <Text style={styles.hint}>还没有留言，来说点什么吧</Text>}
        {messages?.map((m) => (
          <View key={m.id} style={styles.messageRow}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={styles.sender}>{m.sender.name}</Text>
              <Text style={styles.time}>{formatTime(m.createdAt)}</Text>
            </View>
            {!!m.text && <Text style={styles.text}>{m.text}</Text>}
            {m.attachmentUrls.map((url) => (isAudioUrl(url) ? <VoiceBubble key={url} url={url} /> : null))}
          </View>
        ))}
      </View>

      <ErrorText>{error}</ErrorText>

      {user ? (
        <View style={{ marginTop: 10 }}>
          <TextField placeholder="说点什么..." value={text} onChangeText={setText} multiline style={{ minHeight: 60 }} />
          <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
            <SecondaryButton
              title={recording ? "■ 停止录音" : "🎤 录语音"}
              onPress={recording ? stopRecording : startRecording}
              disabled={sending}
            />
            <PrimaryButton title="发送" onPress={() => send()} disabled={sending || !text.trim()} />
          </View>
        </View>
      ) : (
        <Text style={styles.hint}>登录后可留言</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 2 },
  hint: { fontSize: 12, color: colors.subtext, marginBottom: 8 },
  messageRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  sender: { fontSize: 13, fontWeight: "600", color: colors.text },
  time: { fontSize: 11, color: colors.subtext },
  text: { fontSize: 13, color: colors.text, marginTop: 4 },
  voiceBubble: {
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: colors.brandLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  voiceText: { fontSize: 12, color: colors.brandDark, fontWeight: "600" },
});

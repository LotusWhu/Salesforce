"use client";

import { useEffect, useRef, useState } from "react";
import { ConversationContextType, MessageDto } from "@localhub/shared-types";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const AUDIO_EXT = [".m4a", ".mp3", ".webm", ".aac", ".mp4", ".wav"];

function isAudioUrl(url: string) {
  return AUDIO_EXT.some((ext) => url.toLowerCase().endsWith(ext));
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}

export default function MessageThread({ contextType, contextId }: { contextType: ConversationContextType; contextId: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageDto[] | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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

  const canRecord = typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], "voice-message.webm", { type: "audio/webm" });
        setSending(true);
        try {
          const res = await api.upload<{ url: string }>("/uploads", file);
          await send([res.url]);
        } catch (e) {
          setError(e instanceof ApiError ? e.message : "语音上传失败");
        } finally {
          setSending(false);
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      setError("无法访问麦克风，请检查浏览器权限");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className="card">
      <h2 className="mb-1 font-semibold">留言区</h2>
      <p className="mb-3 text-xs text-neutral-400">公开留言，所有人可见；请勿在此交换电话号码，站内消息可以完成全部沟通</p>

      <div className="max-h-80 space-y-3 overflow-y-auto">
        {messages === null && <p className="text-sm text-neutral-400">加载中...</p>}
        {messages !== null && messages.length === 0 && <p className="text-sm text-neutral-400">还没有留言，来说点什么吧</p>}
        {messages?.map((m) => (
          <div key={m.id} className="border-b border-neutral-100 pb-2 last:border-0">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-neutral-800">{m.sender.name}</span>
              <span className="text-xs text-neutral-400">{formatTime(m.createdAt)}</span>
            </div>
            {m.text && <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700">{m.text}</p>}
            {m.attachmentUrls.map((url) =>
              isAudioUrl(url) ? (
                <audio key={url} controls src={url} className="mt-2 h-8 w-full max-w-xs" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={url} src={url} alt="" className="mt-2 h-24 w-24 rounded-lg object-cover" />
              ),
            )}
          </div>
        ))}
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {user ? (
        <div className="mt-3 flex items-end gap-2">
          <textarea
            className="input min-h-16 flex-1"
            placeholder="说点什么..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex flex-col gap-2">
            {canRecord && (
              <button
                type="button"
                className={`btn-secondary text-xs ${recording ? "border-red-500 text-red-600" : ""}`}
                onClick={recording ? stopRecording : startRecording}
                disabled={sending}
              >
                {recording ? "■ 停止" : "🎤 语音"}
              </button>
            )}
            <button type="button" className="btn-primary text-xs" onClick={() => send()} disabled={sending || !text.trim()}>
              发送
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-neutral-500">
          <a href="/login" className="text-brand-500">
            登录
          </a>
          后可留言
        </p>
      )}
    </div>
  );
}

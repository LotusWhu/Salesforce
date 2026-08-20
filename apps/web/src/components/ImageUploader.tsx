"use client";

import { useRef, useState } from "react";
import { ALLOWED_IMAGE_MIME_TYPES, MAX_UPLOAD_SIZE_BYTES, UploadResponseDto } from "@localhub/shared-types";
import { api, ApiError } from "@/lib/api";

const MAX_MB = MAX_UPLOAD_SIZE_BYTES / 1024 / 1024;

export default function ImageUploader({
  urls,
  onChange,
  max = 9,
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    const picked = Array.from(files).slice(0, Math.max(0, max - urls.length));
    for (const file of picked) {
      if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
        setError(`${file.name}: 仅支持 jpg/png 图片`);
        continue;
      }
      if (file.size > MAX_UPLOAD_SIZE_BYTES) {
        setError(`${file.name}: 文件超过 ${MAX_MB}MB 限制`);
        continue;
      }
      setUploading(true);
      try {
        const res = await api.upload<UploadResponseDto>("/uploads", file);
        onChange([...urls, res.url]);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "上传失败，请重试");
      } finally {
        setUploading(false);
      }
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeAt = (idx: number) => {
    onChange(urls.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {urls.map((url, idx) => (
          // eslint-disable-next-line @next/next/no-img-element
          <div key={url} className="relative h-20 w-20 overflow-hidden rounded-lg border border-neutral-200">
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(idx)}
              className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-bl bg-black/60 text-xs text-white"
              aria-label="删除图片"
            >
              ×
            </button>
          </div>
        ))}
        {urls.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-neutral-300 text-xs text-neutral-500 hover:border-brand-400 hover:text-brand-500"
          >
            {uploading ? "上传中..." : "+ 添加图片"}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <p className="mt-1 text-xs text-neutral-400">支持 jpg/png，单张不超过 {MAX_MB}MB，最多 {max} 张</p>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

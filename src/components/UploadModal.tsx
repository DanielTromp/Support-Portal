"use client";

import { useState, useRef, useCallback } from "react";
import { Language } from "@/types";
import { t } from "@/lib/i18n";
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
} from "lucide-react";

interface UploadModalProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
}

type UploadState = "idle" | "dragging" | "uploading" | "success" | "error";

interface UploadResult {
  categoriesCount: number;
  itemsCount: number;
  fileName: string;
  hasBrand?: boolean;
  companyName?: string;
}

export default function UploadModal({
  language,
  isOpen,
  onClose,
  onUploadComplete,
}: UploadModalProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setState("idle");
    setErrorMessage("");
    setResult(null);
  }, []);

  function handleClose() {
    resetState();
    onClose();
  }

  async function uploadFile(file: File) {
    setState("uploading");
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setResult(data);
      setState("success");
      onUploadComplete();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unknown error"
      );
      setState("error");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setState("idle");

    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      uploadFile(file);
    } else {
      setErrorMessage("Only PDF files are accepted");
      setState("error");
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
    // Reset input so the same file can be selected again
    e.target.value = "";
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-0">
          <h2 className="text-xl font-bold text-brand-navy">
            {t(language, "upload_title")}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-500 text-sm mb-4">
            {t(language, "upload_description")}
          </p>

          {/* Upload states */}
          {state === "idle" || state === "dragging" ? (
            <>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setState("dragging");
                }}
                onDragLeave={() => setState("idle")}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                  state === "dragging"
                    ? "drop-zone-active border-brand-purple"
                    : "border-gray-300 hover:border-brand-purple/50 hover:bg-gray-50"
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      state === "dragging"
                        ? "bg-brand-purple text-white"
                        : "bg-brand-purple-soft text-brand-purple"
                    } transition-colors`}
                  >
                    <Upload size={24} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">
                      {t(language, "upload_drop")}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {t(language, "upload_or")}{" "}
                      <span className="text-brand-purple font-medium">
                        {t(language, "upload_browse")}
                      </span>
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">PDF (max 10MB)</p>
                </div>
              </div>

              <div className="flex items-start gap-2 mt-4 p-3 bg-amber-50 rounded-lg">
                <AlertCircle
                  size={16}
                  className="text-amber-500 flex-shrink-0 mt-0.5"
                />
                <p className="text-xs text-amber-700">
                  {t(language, "upload_replace_warning")}
                </p>
              </div>
            </>
          ) : state === "uploading" ? (
            <div className="py-12 text-center">
              <Loader2
                size={40}
                className="animate-spin text-brand-purple mx-auto mb-4"
              />
              <p className="font-medium text-gray-700">
                {t(language, "upload_processing")}
              </p>
            </div>
          ) : state === "success" ? (
            <div className="py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-green-500" />
              </div>
              <p className="font-semibold text-gray-800 text-lg mb-2">
                {t(language, "upload_success")}
              </p>
              {result && (
                <div className="flex items-center justify-center gap-4 text-sm text-gray-500 mt-3">
                  <span className="flex items-center gap-1.5">
                    <FileText size={14} />
                    {result.fileName}
                  </span>
                </div>
              )}
              {result?.hasBrand && result.companyName && (
                <div className="flex items-center justify-center gap-2 text-sm text-brand-purple mt-3 font-medium">
                  <Building2 size={14} />
                  {result.companyName}
                </div>
              )}
              {result && (
                <div className="flex justify-center gap-6 mt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-brand-purple">
                      {result.itemsCount}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t(language, "articles")}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-brand-purple">
                      {result.categoriesCount}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t(language, "categories")}
                    </p>
                  </div>
                </div>
              )}
              <button
                onClick={handleClose}
                className="mt-6 px-6 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-light transition-colors font-medium"
              >
                {t(language, "close")}
              </button>
            </div>
          ) : (
            <div className="py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <p className="font-semibold text-gray-800 text-lg mb-2">
                {t(language, "upload_error")}
              </p>
              {errorMessage && (
                <p className="text-sm text-red-500 mb-4">{errorMessage}</p>
              )}
              <button
                onClick={resetState}
                className="px-6 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-light transition-colors font-medium"
              >
                {t(language, "upload_pdf")}
              </button>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}

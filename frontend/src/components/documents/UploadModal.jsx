import React, { useState, useRef } from "react";
import { ArrowLeft, FileText, Trash2, X, CircleCheck, Upload, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { api } from "@/services/api";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";

export const UploadModal = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [step, setStep] = useState(1); // 1: Select, 2: Upload, 3: Process, 4: Ready
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const resetState = () => {
    setFile(null);
    setStep(1);
    setProgress(0);
    setUploading(false);
    setErrorMessage("");
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setStep(2);
      setErrorMessage("");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      setFile(selected);
      setStep(2);
      setErrorMessage("");
    }
  };

  const handleStartUpload = async () => {
    if (!file) return;

    setUploading(true);
    setStep(2);
    setProgress(30);

    try {
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) {
            clearInterval(timer);
            return 85;
          }
          return prev + 15;
        });
      }, 200);

      setStep(3); // Processing
      const uploadedDoc = await api.uploadDocument(file);
      clearInterval(timer);

      setProgress(100);
      setStep(4); // Ready
      success(`'${uploadedDoc.filename}' uploaded and processed successfully!`);

      setTimeout(() => {
        handleClose();
        onSuccess();
      }, 1200);
    } catch (err) {
      setUploading(false);
      setErrorMessage(err.message || "Failed to upload document. Please check the file.");
      error(err.message || "Upload failed");
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[640px] max-w-[95vw] p-6 gap-6 rounded-2xl">
        {/* Header with back and close */}
        <div className="flex justify-between items-center pb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (step > 1 && !uploading) setStep(1);
              else handleClose();
            }}
          >
            <ArrowLeft className="size-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="size-5" />
          </Button>
        </div>

        {/* Title & Step Indicator */}
        <div className="flex justify-between items-end gap-4 mb-4">
          <div>
            <h1 className="font-bold text-xl tracking-tight text-foreground">Upload a Document</h1>
            <p className="text-muted-foreground text-sm">Step {step} of 4</p>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="flex items-start gap-2 mb-6">
          <div className="flex flex-col flex-1 gap-2">
            <div className={`rounded-full h-1.5 transition-colors ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
            <span className={`text-xs ${step >= 1 ? "font-semibold text-primary" : "text-muted-foreground"}`}>
              Select PDF
            </span>
          </div>
          <div className="flex flex-col flex-1 gap-2">
            <div className={`rounded-full h-1.5 transition-colors ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
            <span className={`text-xs ${step >= 2 ? "font-semibold text-primary" : "text-muted-foreground"}`}>
              Upload
            </span>
          </div>
          <div className="flex flex-col flex-1 gap-2">
            <div className={`rounded-full h-1.5 transition-colors ${step >= 3 ? "bg-primary" : "bg-muted"}`} />
            <span className={`text-xs ${step >= 3 ? "font-semibold text-primary" : "text-muted-foreground"}`}>
              Process
            </span>
          </div>
          <div className="flex flex-col flex-1 gap-2">
            <div className={`rounded-full h-1.5 transition-colors ${step >= 4 ? "bg-primary" : "bg-muted"}`} />
            <span className={`text-xs ${step >= 4 ? "font-semibold text-primary" : "text-muted-foreground"}`}>
              Ready
            </span>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700 mb-4">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* File selection / Preview */}
        {!file ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-primary/40 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-primary/[0.03] hover:border-primary/60 transition-all duration-200 text-center group"
          >
            <div className="size-13 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="size-6" />
            </div>
            <div>
              <p className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
                Drop PDF or text files here
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                Supports PDF, TXT, MD, CSV · Max 50 MB
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,.csv,.json"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button variant="outline" size="sm" className="mt-2">
              Browse computer
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="rounded-xl bg-background border border-border p-4 flex items-center gap-4">
              <div className="rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center size-11 shrink-0">
                <FileText className="size-6" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-semibold text-sm truncate text-foreground">{file.name}</span>
                <span className="text-muted-foreground text-xs">{formatFileSize(file.size)}</span>
              </div>
              {!uploading && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setFile(null);
                    setStep(1);
                  }}
                >
                  <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                </Button>
              )}
            </div>

            {uploading && (
              <div className="flex flex-col gap-2">
                <div className="text-sm flex justify-between items-center">
                  <span className="font-medium text-foreground">
                    {step === 2 ? "Uploading document..." : step === 3 ? "Analyzing and extracting text..." : "Ready!"}
                  </span>
                  <span className="text-muted-foreground text-xs font-semibold">{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            {/* Metadata table matching Screen-4 */}
            <div className="rounded-xl border border-border overflow-hidden text-sm">
              <div className="p-3 px-4 border-b border-border flex justify-between items-center">
                <span className="text-muted-foreground">File type</span>
                <span className="font-semibold uppercase text-foreground">{file.name.split(".").pop()}</span>
              </div>
              <div className="p-3 px-4 border-b border-border flex justify-between items-center">
                <span className="text-muted-foreground">Estimated time</span>
                <span className="font-medium text-foreground">About 10 seconds</span>
              </div>
              <div className="p-3 px-4 flex justify-between items-center">
                <span className="text-muted-foreground">Destination</span>
                <span className="font-medium text-foreground">{user?.name || "My"}’s workspace</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-between items-center mt-6 pt-2">
          <Button
            variant="outline"
            className="text-destructive border-destructive hover:bg-destructive/10"
            onClick={handleClose}
            disabled={uploading && step === 3}
          >
            Cancel
          </Button>

          {file && !uploading && (
            <Button onClick={handleStartUpload} className="min-w-28 shadow-xs hover:shadow-md hover:-translate-y-0.5">
              Upload PDF
            </Button>
          )}

          {step === 4 && (
            <div className="flex items-center gap-2 text-emerald-700 text-sm font-semibold">
              <CircleCheck className="size-5 text-emerald-600" />
              <span>Ready</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

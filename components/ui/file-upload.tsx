"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, X, FileText } from "lucide-react"
import { cn, formatFileSize } from "@/lib/utils"
import { Button } from "./button"

interface FileUploadProps {
  onFileSelect: (file: File) => void
  onFileRemove?: () => void
  selectedFile?: File | null
  accept?: Record<string, string[]>
  maxSize?: number
  disabled?: boolean
  className?: string
}

export function FileUpload({
  onFileSelect,
  onFileRemove,
  selectedFile,
  accept = {
    "application/pdf": [".pdf"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  },
  maxSize = 50 * 1024 * 1024, // 50MB
  disabled = false,
  className,
}: FileUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0])
      }
    },
    [onFileSelect],
  )

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
    disabled,
  })

  if (selectedFile) {
    return (
      <div className={cn("border border-gray-300 rounded-lg p-4 bg-gray-50", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
          {onFileRemove && (
            <Button variant="ghost" size="icon" onClick={onFileRemove} disabled={disabled}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          {isDragActive ? "Drop the file here" : "Upload a file"}
        </p>
        <p className="text-sm text-gray-500 mb-4">Drag and drop your file here, or click to browse</p>
        <p className="text-xs text-gray-400">Supports PDF and DOCX files up to {formatFileSize(maxSize)}</p>
      </div>

      {fileRejections.length > 0 && (
        <div className="mt-4 space-y-2">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name} className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              <p className="font-medium">{file.name}</p>
              {errors.map((error) => (
                <p key={error.code} className="text-xs">
                  {error.message}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

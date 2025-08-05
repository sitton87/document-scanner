"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, Download, RotateCcw, Power, PowerOff } from "lucide-react";
import ActionButtons from "@/components/ui/ActionButtons";

interface Point {
  x: number;
  y: number;
}

interface DocumentBounds {
  topLeft: Point;
  topRight: Point;
  bottomLeft: Point;
  bottomRight: Point;
}

export default function CameraCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [documentBounds, setDocumentBounds] = useState<DocumentBounds | null>(
    null
  );
  const [autoMode, setAutoMode] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize detection
  useEffect(() => {
    const loadDetection = async () => {
      try {
        // Test AWS connection
        const { testConnection } = await import("@/lib/aws/textractService");
        const result = await testConnection();
        console.log("🚀", result);
      } catch (error) {
        console.error("Failed to initialize detection:", error);
      }
    };
    loadDetection();
  }, []);

  // Document detection loop
  useEffect(() => {
    if (!isStreaming || !autoMode || isCapturing || capturedImage) return;

    const detectInterval = setInterval(async () => {
      if (videoRef.current && canvasRef.current && overlayCanvasRef.current) {
        await performDetection();
      }
    }, 1000); // כל שנייה

    return () => clearInterval(detectInterval);
  }, [isStreaming, autoMode, isCapturing, capturedImage]);

  const performDetection = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      // Copy video frame to canvas
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      // Try AWS Textract first
      let bounds = null;
      try {
        const { detectDocument: detectAWS } = await import(
          "@/lib/aws/textractService"
        );
        bounds = await detectAWS(canvas);
        console.log("🎯 AWS bounds result:", bounds);
      } catch (error) {
        console.log("⚠️ AWS failed, using local detection");
        const { detectDocument } = await import(
          "@/lib/opencv/documentDetection"
        );
        bounds = detectDocument(canvas);
      }

      console.log("🎯 Setting document bounds:", bounds);
      setDocumentBounds(bounds);

      // Draw overlay
      drawOverlay(bounds);

      // Auto capture if document found
      if (bounds && autoMode && !isCapturing) {
        startCountdown();
      }
    } catch (error) {
      console.error("Detection error:", error);
    }
  };

  const drawOverlay = (bounds: DocumentBounds | null) => {
    const overlay = overlayCanvasRef.current;
    if (!overlay) return;

    const ctx = overlay.getContext("2d");
    if (!ctx) return;

    // Clear overlay
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    if (bounds) {
      // Draw document outline
      ctx.strokeStyle = "#10B981"; // Green
      ctx.lineWidth = 3;
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.moveTo(bounds.topLeft.x, bounds.topLeft.y);
      ctx.lineTo(bounds.topRight.x, bounds.topRight.y);
      ctx.lineTo(bounds.bottomRight.x, bounds.bottomRight.y);
      ctx.lineTo(bounds.bottomLeft.x, bounds.bottomLeft.y);
      ctx.closePath();
      ctx.stroke();

      // Draw corner dots
      ctx.fillStyle = "#10B981";
      const drawCorner = (point: Point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
        ctx.fill();
      };

      drawCorner(bounds.topLeft);
      drawCorner(bounds.topRight);
      drawCorner(bounds.bottomRight);
      drawCorner(bounds.bottomLeft);

      // Fill semi-transparent
      ctx.fillStyle = "rgba(16, 185, 129, 0.1)";
      ctx.beginPath();
      ctx.moveTo(bounds.topLeft.x, bounds.topLeft.y);
      ctx.lineTo(bounds.topRight.x, bounds.topRight.y);
      ctx.lineTo(bounds.bottomRight.x, bounds.bottomRight.y);
      ctx.lineTo(bounds.bottomLeft.x, bounds.bottomLeft.y);
      ctx.closePath();
      ctx.fill();
    }
  };

  const startCountdown = () => {
    if (isCapturing) return;

    setIsCapturing(true);
    setCountdown(3);

    const countInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countInterval);
          captureWithCrop();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);

        // Set overlay canvas size when video loads
        videoRef.current.onloadedmetadata = () => {
          if (overlayCanvasRef.current && videoRef.current) {
            overlayCanvasRef.current.width = videoRef.current.videoWidth;
            overlayCanvasRef.current.height = videoRef.current.videoHeight;
          }
        };
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const captureWithCrop = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d")!;

      // Copy video frame to canvas
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      // Get fresh bounds for cropping
      let bounds = null;
      try {
        const { detectDocument: detectAWS } = await import(
          "@/lib/aws/textractService"
        );
        bounds = await detectAWS(canvas);
        console.log("🎯 Fresh bounds for cropping:", bounds);
      } catch (error) {
        console.log("⚠️ AWS failed during capture");
      }

      let finalImage: string;

      if (bounds) {
        // ← השתמש ב-bounds החדש!
        // Crop with AWS precision
        const { cropDocument } = await import("@/lib/aws/textractService");
        finalImage = cropDocument(canvas, bounds);
        console.log("📸 AWS captured and cropped document");
      } else {
        // Full image
        finalImage = canvas.toDataURL("image/jpeg", 0.9);
        console.log("📸 Captured full image - no bounds available");
      }

      setCapturedImage(finalImage);
      setIsCapturing(false);
      setCountdown(0);
      // setDocumentBounds(null); // Don't clear bounds yet
    } catch (error) {
      console.error("Capture error:", error);
      setIsCapturing(false);
      setCountdown(0);
    }
  };

  const manualCapture = () => {
    captureWithCrop();
  };

  const retake = () => {
    setCapturedImage(null);
    setIsCapturing(false);
    setCountdown(0);
  };

  const saveDocument = async () => {
    if (!capturedImage) return;

    setIsSaving(true); // הוסף זה

    try {
      const filename = `document_${Date.now()}`;

      const response = await fetch("/api/save-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageData: capturedImage,
          filename,
        }),
      });

      if (response.ok) {
        alert("📄 Document saved successfully!");
        setCapturedImage(null);
      } else {
        throw new Error("Failed to save document");
      }
    } catch (error) {
      console.error("Error saving document:", error);
      alert("❌ Failed to save document");
    } finally {
      setIsSaving(false);
    }
  };

  const scanAnother = () => {
    setCapturedImage(null);
    setIsCapturing(false);
    setCountdown(0);
  };

  const finishAndClose = () => {
    setCapturedImage(null);
    setIsCapturing(false);
    setCountdown(0);
    // Stop camera
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6 max-w-2xl mx-auto p-4">
      <canvas ref={canvasRef} className="hidden" />

      {!capturedImage ? (
        <>
          <div className="relative w-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`rounded-lg shadow-lg w-full max-w-md mx-auto ${
                !isStreaming ? "hidden" : ""
              }`}
            />

            {/* Overlay canvas for detection */}
            <canvas
              ref={overlayCanvasRef}
              className={`absolute top-0 left-1/2 transform -translate-x-1/2 rounded-lg pointer-events-none ${
                !isStreaming ? "hidden" : ""
              }`}
              style={{
                maxWidth: "448px", // max-w-md equivalent
                width: "100%",
                height: "auto",
              }}
            />

            {!isStreaming && (
              <div className="flex items-center justify-center bg-gray-200 rounded-lg w-full max-w-md mx-auto aspect-[4/3]">
                <button
                  onClick={startCamera}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Camera size={20} />
                  <span>Start Camera</span>
                </button>
              </div>
            )}

            {/* Countdown overlay */}
            {countdown > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                <div className="text-white text-6xl font-bold animate-pulse">
                  {countdown}
                </div>
              </div>
            )}
          </div>

          {/* Status */}
          {isStreaming && (
            <div className="text-center">
              {isCapturing ? (
                <div className="text-orange-600 font-semibold">
                  📸 Capturing in {countdown}s...
                </div>
              ) : documentBounds ? (
                <div className="text-green-600 font-semibold">
                  ✅ Document Ready
                </div>
              ) : (
                <div className="text-gray-600">
                  📄 Position document in frame
                </div>
              )}
            </div>
          )}

          {/* Controls */}
          {isStreaming && (
            <div className="flex space-x-4 items-center">
              {/* Auto Mode Toggle */}
              <button
                onClick={() => setAutoMode(!autoMode)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                  autoMode
                    ? "bg-green-100 border-green-500 text-green-700"
                    : "bg-gray-100 border-gray-300 text-gray-600"
                }`}
              >
                {autoMode ? <Power size={16} /> : <PowerOff size={16} />}
                <span className="text-sm font-medium">
                  {autoMode ? "Auto" : "Manual"}
                </span>
              </button>

              {/* Manual Capture */}
              {!autoMode && (
                <button
                  onClick={manualCapture}
                  disabled={isCapturing}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Camera size={20} />
                  <span>Capture</span>
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <img
            src={capturedImage}
            alt="Captured document"
            className="rounded-lg shadow-lg max-w-md w-full"
          />

          <ActionButtons
            onRetake={retake}
            onSave={saveDocument}
            onScanAnother={scanAnother}
            onFinishAndClose={finishAndClose}
            isSaving={isSaving}
          />
        </>
      )}
    </div>
  );
}

# Navigate to project root
Set-Location "C:\projects\document-scanner"

Write-Host "Creating project files..." -ForegroundColor Green

# Create environment file
@"
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
"@ | Out-File -FilePath ".env.local" -Encoding UTF8

Write-Host "✓ Created .env.local"

# Create types
@"
export interface Invoice {
  id: string
  created_at: string
  user_id?: string
  pdf_url: string
  jpg_url: string
  filename: string
  file_size: number
  metadata?: any
}

export interface DocumentBounds {
  topLeft: Point
  topRight: Point
  bottomLeft: Point
  bottomRight: Point
}

export interface Point {
  x: number
  y: number
}
"@ | Out-File -FilePath "src\types\index.ts" -Encoding UTF8

Write-Host "✓ Created types/index.ts"

# Create Supabase client
@"
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// For server-side operations
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
"@ | Out-File -FilePath "src\lib\supabase\client.ts" -Encoding UTF8

Write-Host "✓ Created lib/supabase/client.ts"

# Create OpenCV utilities
@"
export const initializeOpenCV = (): Promise<void> => {
  return new Promise((resolve) => {
    // OpenCV will be loaded dynamically
    console.log('OpenCV initialization started')
    resolve()
  })
}

export const detectDocument = (imageElement: HTMLImageElement) => {
  // Document detection logic will be implemented here
  console.log('Document detection initiated')
}

export const cropDocument = (image: any, bounds: any) => {
  // Document cropping logic will be implemented here
  console.log('Document cropping initiated')
}
"@ | Out-File -FilePath "src\lib\opencv\documentDetection.ts" -Encoding UTF8

Write-Host "✓ Created lib/opencv/documentDetection.ts"

# Create camera component
@"
'use client'

import { useRef, useState, useCallback } from 'react'
import { Camera, Download } from 'lucide-react'

export default function CameraCapture() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsStreaming(true)
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
    }
  }

  const capture = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      
      if (context) {
        context.drawImage(videoRef.current, 0, 0)
        const imageData = canvas.toDataURL('image/jpeg', 0.9)
        setCapturedImage(imageData)
      }
    }
  }, [])

  const retake = () => {
    setCapturedImage(null)
  }

  return (
    <div className="flex flex-col items-center space-y-4 max-w-lg mx-auto">
      <canvas ref={canvasRef} className="hidden" />
      
      {!capturedImage ? (
        <>
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="rounded-lg shadow-lg w-full max-w-md"
            />
            {!isStreaming && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200 rounded-lg">
                <button
                  onClick={startCamera}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                >
                  Start Camera
                </button>
              </div>
            )}
          </div>
          
          {isStreaming && (
            <button
              onClick={capture}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Camera size={20} />
              <span>Capture Document</span>
            </button>
          )}
        </>
      ) : (
        <>
          <img 
            src={capturedImage} 
            alt="Captured document" 
            className="rounded-lg shadow-lg max-w-md w-full"
          />
          <div className="flex space-x-4">
            <button
              onClick={retake}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Retake
            </button>
            <button
              className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download size={20} />
              <span>Save Document</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
"@ | Out-File -FilePath "src\components\camera\CameraCapture.tsx" -Encoding UTF8

Write-Host "✓ Created components/camera/CameraCapture.tsx"

# Update main page
@"
import CameraCapture from '@/components/camera/CameraCapture'

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Document Scanner
        </h1>
        <p className="text-lg text-gray-600">
          Scan and save your invoices automatically
        </p>
      </div>
      
      <div className="flex justify-center">
        <CameraCapture />
      </div>
    </main>
  )
}
"@ | Out-File -FilePath "src\app\page.tsx" -Encoding UTF8

Write-Host "✓ Updated src/app/page.tsx"

# Create API routes directory and files
New-Item -ItemType Directory -Path "src\app\api\upload" -Force | Out-Null

@"
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Upload logic will be implemented here
    console.log('File upload initiated for:', file.name)
    
    return NextResponse.json({ 
      message: 'File uploaded successfully',
      filename: file.name,
      size: file.size
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
"@ | Out-File -FilePath "src\app\api\upload\route.ts" -Encoding UTF8

Write-Host "✓ Created api/upload/route.ts"

Write-Host "`nAll files created successfully!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Configure your .env.local file with Supabase credentials"
Write-Host "2. Run: npm run dev"
Write-Host "3. Visit: http://localhost:3000"
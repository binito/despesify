'use client'

import { useRef, useEffect, useState } from 'react'
import jsQR from 'jsqr'

interface QRScannerProps {
  onScan: (data: string) => void
  onClose: () => void
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [scanning, setScanning] = useState(true)
  const [error, setError] = useState('')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [scanAttempts, setScanAttempts] = useState(0)
  const [manualCapture, setManualCapture] = useState(false)
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string>('')
  const animationFrameRef = useRef<number>()

  useEffect(() => {
    loadCameras()
  }, [])

  useEffect(() => {
    if (selectedCamera || cameras.length > 0) {
      startCamera()
    }
    return () => {
      stopCamera()
    }
  }, [selectedCamera])

  const loadCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      setCameras(videoDevices)

      // Select back camera by default (usually has "back" or "rear" in label)
      const backCamera = videoDevices.find(device =>
        device.label.toLowerCase().includes('back') ||
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('traseira')
      )

      if (backCamera) {
        setSelectedCamera(backCamera.deviceId)
      } else if (videoDevices.length > 0) {
        // If no back camera found, use last camera (usually back on mobile)
        setSelectedCamera(videoDevices[videoDevices.length - 1].deviceId)
      }
    } catch (err) {
      console.error('Error loading cameras:', err)
      setError('Erro ao carregar câmaras')
    }
  }

  const startCamera = async () => {
    try {
      // Stop any existing stream first
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }

      // Build constraints
      const constraints: any = {
        video: {
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
        }
      }

      // Use specific camera if selected, otherwise use back camera
      if (selectedCamera) {
        constraints.video.deviceId = { exact: selectedCamera }
      } else {
        constraints.video.facingMode = { ideal: 'environment' }
      }

      // Request camera
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)

      setStream(mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.setAttribute('playsinline', 'true') // Required for iOS
        videoRef.current.play()

        // Start scanning once video is ready
        videoRef.current.onloadedmetadata = () => {
          scanQRCode()
        }
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      setError('Não foi possível aceder à câmara. Verifique as permissões.')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }

  const scanQRCode = () => {
    if (!scanning) return

    const video = videoRef.current
    const canvas = canvasRef.current

    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return

      // Set canvas size to match video
      canvas.height = video.videoHeight
      canvas.width = video.videoWidth

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Get image data from canvas
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      // Increment scan attempts counter
      setScanAttempts(prev => prev + 1)

      // Scan for QR code with more aggressive settings
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth', // Try both normal and inverted
      })

      if (code) {
        console.log('QR Code detected:', code.data)
        console.log('Detection successful after', scanAttempts, 'attempts')

        // Vibrate on success if available
        if (navigator.vibrate) {
          navigator.vibrate(200)
        }

        setScanning(false)
        stopCamera()
        onScan(code.data)
        return
      }
    }

    // Continue scanning
    animationFrameRef.current = requestAnimationFrame(scanQRCode)
  }

  const handleManualCapture = () => {
    setManualCapture(true)
    const video = videoRef.current
    const canvas = canvasRef.current

    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) {
        setManualCapture(false)
        return
      }

      // Set canvas size to match video
      canvas.height = video.videoHeight
      canvas.width = video.videoWidth

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Get image data from canvas
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      // Scan for QR code
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      })

      if (code) {
        console.log('✅ QR Code detected manually!')
        console.log('QR Data:', code.data)
        console.log('QR Data length:', code.data.length)

        if (navigator.vibrate) {
          navigator.vibrate(200)
        }

        // Don't stop camera yet - let parent handle it
        setScanning(false)
        setManualCapture(false)

        // Call onScan with the data
        setTimeout(() => {
          stopCamera()
          onScan(code.data)
        }, 100)
      } else {
        // Show error briefly
        alert('QR Code não detetado nesta captura! Tente novamente com melhor foco.')
        setManualCapture(false)
      }
    } else {
      alert('Câmara ainda não está pronta. Aguarde 1-2 segundos.')
      setManualCapture(false)
    }
  }

  const handleClose = () => {
    setScanning(false)
    stopCamera()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h2 className="text-white font-bold text-lg">Digitalizar QR Code</h2>
            <p className="text-blue-100 text-sm">Aponte para o QR da fatura AT</p>
          </div>
          <button
            onClick={handleClose}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg font-bold transition-all"
          >
            ✕ Fechar
          </button>
        </div>

        {/* Camera Selector */}
        {cameras.length > 1 && (
          <div className="mt-3">
            <label className="block text-white text-xs font-bold mb-2">📷 Selecionar Câmara:</label>
            <select
              value={selectedCamera}
              onChange={(e) => setSelectedCamera(e.target.value)}
              className="w-full bg-white bg-opacity-20 text-white border-2 border-white border-opacity-30 rounded-lg px-3 py-2 text-sm font-medium backdrop-blur-sm"
            >
              {cameras.map((camera, index) => (
                <option key={camera.deviceId} value={camera.deviceId} className="text-gray-900">
                  {camera.label || `Câmara ${index + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Camera View */}
      <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
        {error ? (
          <div className="text-center">
            <div className="text-6xl mb-4">📱</div>
            <p className="text-white text-lg mb-4">{error}</p>
            <button
              onClick={handleClose}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold"
            >
              Voltar
            </button>
          </div>
        ) : (
          <div className="relative max-w-2xl w-full">
            {/* Video element */}
            <video
              ref={videoRef}
              className="w-full h-auto rounded-2xl shadow-2xl"
              playsInline
              muted
            />

            {/* Scanning overlay */}
            {scanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {/* Scanning frame */}
                <div className="relative w-64 h-64 sm:w-80 sm:h-80 pointer-events-none">
                  {/* Corner borders - thicker and brighter */}
                  <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-green-400 rounded-tl-2xl shadow-lg shadow-green-400/50"></div>
                  <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-green-400 rounded-tr-2xl shadow-lg shadow-green-400/50"></div>
                  <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-green-400 rounded-bl-2xl shadow-lg shadow-green-400/50"></div>
                  <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-green-400 rounded-br-2xl shadow-lg shadow-green-400/50"></div>

                  {/* Scanning line animation */}
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-scan shadow-lg shadow-green-400/50"></div>
                  </div>
                </div>

                {/* Help text and manual capture button */}
                <div className="mt-4 space-y-3">
                  <div className="bg-black bg-opacity-60 px-4 py-2 rounded-lg text-center">
                    <p className="text-white text-sm font-bold">Posicione o QR na moldura verde</p>
                    <p className="text-gray-300 text-xs">Mantenha a câmara estável e bem focada</p>
                  </div>
                  <button
                    onClick={handleManualCapture}
                    disabled={manualCapture}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-500 disabled:to-gray-600 text-white px-6 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:scale-100"
                  >
                    {manualCapture ? '⏳ A processar...' : '📸 CAPTURAR AGORA'}
                  </button>
                </div>
              </div>
            )}

            {/* Hidden canvas for processing */}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6">
        <div className="text-center mb-3">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">💡</span>
            <p className="text-white font-bold">Dica</p>
          </div>
          <p className="text-gray-300 text-sm">
            Posicione o QR code da fatura AT dentro da moldura. A deteção é automática!
          </p>
        </div>
        {scanning && (
          <div className="text-center text-xs text-gray-400 flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>A digitalizar... ({scanAttempts} tentativas)</span>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

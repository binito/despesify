#!/bin/bash

echo "Test QR Reader API"
echo "=================="

# Test if Python dependencies are installed
echo ""
echo "Checking Python dependencies..."
python3 -c "import cv2; print('✓ OpenCV installed')" 2>/dev/null || echo "✗ OpenCV not installed - run: pip3 install opencv-python"
python3 -c "from pyzbar import pyzbar; print('✓ pyzbar installed')" 2>/dev/null || echo "✗ pyzbar not installed - run: pip3 install pyzbar"

# Test if Python script exists
echo ""
echo "Checking Python script..."
if [ -f "scripts/leitor_qr_faturas_at.py" ]; then
    echo "✓ QR reader script found"
    python3 scripts/leitor_qr_faturas_at.py --help 2>/dev/null | head -3
else
    echo "✗ QR reader script not found at scripts/leitor_qr_faturas_at.py"
fi

echo ""
echo "To use QR reader:"
echo "1. Install dependencies: pip3 install -r requirements.txt"
echo "2. Upload an invoice image with QR code in the app"
echo "3. Click the 📱 QR button to extract data"

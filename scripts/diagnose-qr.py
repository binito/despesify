#!/usr/bin/env python3
"""
Script de diagnóstico para leitor QR
Testa todas as dependências e funcionalidades
"""

import sys
import os

def test_imports():
    """Test Python imports"""
    print("=" * 60)
    print("TESTANDO IMPORTS")
    print("=" * 60)

    try:
        import cv2
        print("✓ OpenCV (cv2) - OK")
        print(f"  Versão: {cv2.__version__}")
    except ImportError as e:
        print(f"✗ OpenCV (cv2) - FALHOU: {e}")
        return False

    try:
        from pyzbar import pyzbar
        print("✓ pyzbar - OK")
    except ImportError as e:
        print(f"✗ pyzbar - FALHOU: {e}")
        return False

    try:
        import json
        print("✓ json - OK")
    except ImportError as e:
        print(f"✗ json - FALHOU: {e}")
        return False

    return True


def test_qr_detection():
    """Test QR detection capabilities"""
    print("\n" + "=" * 60)
    print("TESTANDO DETECÇÃO QR")
    print("=" * 60)

    import cv2
    from pyzbar import pyzbar

    # Create a simple test image
    test_image = cv2.imread("test.jpg")
    if test_image is None:
        print("⚠ Sem imagem de teste (test.jpg)")
        print("  Criar uma imagem com QR code para teste")
        return None

    print(f"✓ Imagem de teste carregada")
    print(f"  Dimensões: {test_image.shape}")

    # Try detection
    print("\nTentando detectar QR codes...")
    codes = pyzbar.decode(test_image)

    if codes:
        print(f"✓ {len(codes)} QR code(s) encontrado(s)")
        for i, code in enumerate(codes):
            data = code.data.decode('utf-8')
            print(f"  QR {i+1}: {data[:50]}...")
            print(f"    Tipo: {code.type}")
            print(f"    Rect: {code.rect}")
    else:
        print("✗ Nenhum QR code encontrado")
        print("  Tentando com processamento...")

        # Try with grayscale
        gray = cv2.cvtColor(test_image, cv2.COLOR_BGR2GRAY)
        codes = pyzbar.decode(gray)

        if codes:
            print(f"✓ {len(codes)} QR code(s) encontrado(s) com grayscale")
        else:
            print("✗ Ainda nenhum QR code encontrado")

    return codes is not None and len(codes) > 0


def test_script():
    """Test the main QR reader script"""
    print("\n" + "=" * 60)
    print("TESTANDO SCRIPT PRINCIPAL")
    print("=" * 60)

    script_path = os.path.join(os.path.dirname(__file__), 'leitor_qr_faturas_at.py')

    if not os.path.exists(script_path):
        print(f"✗ Script não encontrado: {script_path}")
        return False

    print(f"✓ Script encontrado: {script_path}")

    # Try importing the module
    sys.path.insert(0, os.path.dirname(script_path))

    try:
        from leitor_qr_faturas_at import LeitorQRFaturaAT
        print("✓ Classe LeitorQRFaturaAT importada com sucesso")

        leitor = LeitorQRFaturaAT()
        print("✓ Instância criada com sucesso")

        # Check if methods exist
        if hasattr(leitor, 'ler_qr_de_imagem'):
            print("✓ Método ler_qr_de_imagem existe")
        if hasattr(leitor, 'descodificar_qr_fatura'):
            print("✓ Método descodificar_qr_fatura existe")
        if hasattr(leitor, 'processar_fatura'):
            print("✓ Método processar_fatura existe")

        return True

    except Exception as e:
        print(f"✗ Erro ao importar: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    print("\n")
    print("╔" + "=" * 58 + "╗")
    print("║" + " DIAGNÓSTICO DO LEITOR QR DE FATURAS AT ".center(58) + "║")
    print("╚" + "=" * 58 + "╝")

    # Test imports
    if not test_imports():
        print("\n✗ DIAGNÓSTICO FALHOU: Dependências Python não instaladas")
        print("\nInstale com: pip3 install -r requirements.txt")
        return 1

    # Test QR detection
    result = test_qr_detection()

    # Test script
    if not test_script():
        print("\n✗ DIAGNÓSTICO FALHOU: Script principal com erro")
        return 1

    print("\n" + "=" * 60)
    print("RESUMO")
    print("=" * 60)

    if result is None:
        print("⚠ Sem imagem de teste")
        print("  Crie uma imagem (test.jpg) com um código QR para teste completo")
        print("\n✓ Sistema pronto para usar!")
    elif result:
        print("✓ TODOS OS TESTES PASSARAM COM SUCESSO!")
        print("  Sistema está pronto para produção")
    else:
        print("⚠ QR codes não foram detectados")
        print("  Possíveis soluções:")
        print("  1. Melhorar qualidade da imagem")
        print("  2. Aumentar o tamanho do QR code")
        print("  3. Verificar iluminação")

    return 0


if __name__ == "__main__":
    sys.exit(main())

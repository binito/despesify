"""
Leitor de QR Code de Faturas Portuguesas (AT)
Extrai e descodifica informação estruturada dos códigos QR das faturas emitidas em Portugal
"""

import cv2
try:
    from pyzbar import pyzbar
    PYZBAR_AVAILABLE = True
except ImportError:
    PYZBAR_AVAILABLE = False
    pyzbar = None

import json
from datetime import datetime
from typing import Dict, Optional, List
import sys
import os
import numpy as np


class LeitorQRFaturaAT:
    """Classe para ler e descodificar QR codes de faturas portuguesas"""
    
    def __init__(self):
        self.taxas_iva_pt = {
            'NOR': 23,  # Taxa normal
            'INT': 13,  # Taxa intermédia
            'RED': 6,   # Taxa reduzida
            'ISE': 0,   # Isento
            'OUT': 0    # Outros
        }

    def _preprocess_image(self, img: np.ndarray) -> List[np.ndarray]:
        """
        Aplica várias técnicas de pré-processamento na imagem para melhorar a deteção de QR Codes.
        Retorna uma lista de imagens pré-processadas (grayscale, thresholded, CLAHE).
        """
        processed_images = []

        if img is None:
            return processed_images

        # 1. Grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        processed_images.append(gray)

        # 2. Aumentar resolução se muito pequena
        height, width = gray.shape
        if max(height, width) < 1000:
            scale = 1000 / max(height, width)
            gray_upscaled = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
            processed_images.append(gray_upscaled)

        # 3. Otsu's thresholding (binarização automática)
        _, otsu = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        processed_images.append(otsu)

        # 4. Adaptive Thresholding - Gaussian
        thresh_gauss = cv2.adaptiveThreshold(gray, 255,
                                      cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                      cv2.THRESH_BINARY, 11, 2)
        processed_images.append(thresh_gauss)

        # 5. Adaptive Thresholding - Mean (alternativa)
        thresh_mean = cv2.adaptiveThreshold(gray, 255,
                                      cv2.ADAPTIVE_THRESH_MEAN_C,
                                      cv2.THRESH_BINARY, 11, 2)
        processed_images.append(thresh_mean)

        # 6. CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced_gray = clahe.apply(gray)
        processed_images.append(enhanced_gray)

        # 7. Histogram Equalization (equalização simples)
        equalized = cv2.equalizeHist(gray)
        processed_images.append(equalized)

        # 8. Sharpening para melhorar nitidez
        kernel_sharpening = np.array([[-1,-1,-1],
                                       [-1, 9,-1],
                                       [-1,-1,-1]])
        sharpened = cv2.filter2D(gray, -1, kernel_sharpening)
        processed_images.append(sharpened)

        # 9. Denoise + sharpen
        denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
        processed_images.append(denoised)

        # 10. Morphological operations para limpar ruído
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3,3))
        morph = cv2.morphologyEx(gray, cv2.MORPH_CLOSE, kernel)
        processed_images.append(morph)

        return processed_images

    def ler_qr_de_imagem(self, caminho_imagem: str, debug_mode: bool = False) -> Optional[str]:
        """
        Lê o código QR de uma imagem de fatura

        Args:
            caminho_imagem: Caminho para o ficheiro de imagem
            debug_mode: Se True, salva imagens pré-processadas para debug

        Returns:
            String com os dados do QR ou None se não encontrar
        """
        try:
            print(f"Lendo imagem: {caminho_imagem}", file=sys.stderr)
            # Ler a imagem
            imagem = cv2.imread(caminho_imagem)

            if imagem is None:
                print(f"Erro: Não foi possível ler a imagem {caminho_imagem}", file=sys.stderr)
                return None

            print(f"Imagem carregada com sucesso. Dimensões: {imagem.shape}", file=sys.stderr)
            height, width = imagem.shape[:2]
            print(f"Resolução: {width}x{height} pixels", file=sys.stderr)

            # Usar OpenCV QRCodeDetector (mais robusto)
            qr_detector = cv2.QRCodeDetector()

            # Gerar imagens pré-processadas
            processed_images = self._preprocess_image(imagem)
            # Adicionar a imagem original em escala de cinza para tentar também
            gray_original = cv2.cvtColor(imagem, cv2.COLOR_BGR2GRAY)
            processed_images.insert(0, gray_original) # Prioritize grayscale

            # Tentar detectar QR com OpenCV em cada imagem pré-processada
            print("Tentando detectar QR com OpenCV em imagens pré-processadas...", file=sys.stderr)
            for i, p_img in enumerate(processed_images):
                print(f"  Tentando imagem processada {i}...", file=sys.stderr)

                # Save debug image if in debug mode
                if debug_mode:
                    debug_path = caminho_imagem.replace('.png', f'_debug_{i}.png')
                    cv2.imwrite(debug_path, p_img)
                    print(f"  Debug: Salva em {debug_path}", file=sys.stderr)

                decoded_text, points, straight_qr = qr_detector.detectAndDecode(p_img)
                if decoded_text and len(decoded_text) > 0:
                    print(f"✓ QR encontrado em imagem processada {i}!", file=sys.stderr)
                    print(f"Dados do QR (primeiros 100 chars): {decoded_text[:100]}...", file=sys.stderr)
                    return decoded_text

            # Se não encontrar, tentar com rotações na imagem original (ainda é válido)
            print("QR não encontrado em pré-processadas. Tentando com rotações na imagem original...", file=sys.stderr)
            for angulo in [90, 180, 270]:
                print(f"  Tentando rotação de {angulo}°...", file=sys.stderr)
                rotacionada = cv2.rotate(imagem, cv2.ROTATE_90_CLOCKWISE if angulo == 90 else
                                       cv2.ROTATE_180 if angulo == 180 else
                                       cv2.ROTATE_90_COUNTERCLOCKWISE)
                decoded_text, points, straight_qr = qr_detector.detectAndDecode(rotacionada)
                if decoded_text and len(decoded_text) > 0:
                    print(f"  ✓ QR encontrado com rotação de {angulo}°", file=sys.stderr)
                    print(f"Dados do QR (primeiros 100 chars): {decoded_text[:100]}...", file=sys.stderr)
                    return decoded_text

            # Se OpenCV ainda não funcionar, tentar pyzbar como fallback em todas as versões da imagem
            if PYZBAR_AVAILABLE:
                print("OpenCV não encontrou em nenhuma tentativa. Tentando com pyzbar em todas as versões...", file=sys.stderr)

                # Tentar pyzbar na imagem original colorida
                codigos_qr = pyzbar.decode(imagem)
                if codigos_qr:
                    print(f"✓ {len(codigos_qr)} código(s) QR encontrado(s) com pyzbar (original colorida)", file=sys.stderr)
                    dados_qr = codigos_qr[0].data.decode('utf-8')
                    print(f"Dados do QR (primeiros 100 chars): {dados_qr[:100]}...", file=sys.stderr)
                    return dados_qr

                # Tentar pyzbar em cada imagem pré-processada (incluindo grayscale original)
                for i, p_img in enumerate(processed_images):
                    print(f"  Tentando pyzbar em imagem processada {i}...", file=sys.stderr)
                    codigos_qr = pyzbar.decode(p_img)
                    if codigos_qr:
                        print(f"✓ {len(codigos_qr)} código(s) QR encontrado(s) com pyzbar (processada {i})", file=sys.stderr)
                        dados_qr = codigos_qr[0].data.decode('utf-8')
                        print(f"Dados do QR (primeiros 100 chars): {dados_qr[:100]}...", file=sys.stderr)
                        return dados_qr

            print("⚠ Nenhum código QR encontrado na imagem", file=sys.stderr)
            print("Dica: Certifique-se de que:", file=sys.stderr)
            print("  - O QR code está visível e legível", file=sys.stderr)
            print("  - A imagem tem boa qualidade", file=sys.stderr)
            print("  - O QR não está cortado ou muito distorcido", file=sys.stderr)
            return None

        except Exception as e:
            print(f"Erro ao ler QR code: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc(file=sys.stderr)
            return None
    
    def descodificar_qr_fatura(self, dados_qr: str) -> Dict:
        """
        Descodifica os dados do QR code de uma fatura portuguesa
        
        Formato esperado (separado por asteriscos):
        A:NIF_Emitente*B:NIF_Adquirente*C:País*D:TipoDoc*E:Estado*F:DataEmissao*G:NumDoc*H:ATCUD*I1:PT*I2:ValorBase*I3:ValorIVA*I4:TaxaIVA*...*N:ValorTotal*O:Retencao*P:Hash*Q:CertificadoNum*R:OutrasInfos
        
        Args:
            dados_qr: String com os dados extraídos do QR
            
        Returns:
            Dicionário com os dados descodificados
        """
        try:
            # Dividir os campos pelo asterisco
            campos = dados_qr.split('*')
            
            fatura = {
                'raw_data': dados_qr,
                'nif_emitente': None,
                'nif_adquirente': None,
                'pais_adquirente': None,
                'tipo_documento': None,
                'estado_documento': None,
                'data_emissao': None,
                'numero_documento': None,
                'atcud': None,
                'linhas_iva': [],
                'valor_total': None,
                'retencao_iva': None,
                'hash': None,
                'numero_certificado': None,
                'outras_infos': None
            }
            
            linhas_iva_temp = {}
            
            for campo in campos:
                if ':' not in campo:
                    continue
                    
                chave, valor = campo.split(':', 1)
                
                if chave == 'A':
                    fatura['nif_emitente'] = valor
                elif chave == 'B':
                    fatura['nif_adquirente'] = valor
                elif chave == 'C':
                    fatura['pais_adquirente'] = valor
                elif chave == 'D':
                    fatura['tipo_documento'] = valor
                elif chave == 'E':
                    fatura['estado_documento'] = valor
                elif chave == 'F':
                    # Data no formato YYYYMMDD
                    try:
                        data_obj = datetime.strptime(valor, '%Y%m%d')
                        fatura['data_emissao'] = data_obj.strftime('%Y-%m-%d')
                    except:
                        fatura['data_emissao'] = valor
                elif chave == 'G':
                    fatura['numero_documento'] = valor
                elif chave == 'H':
                    fatura['atcud'] = valor
                elif chave.startswith('I'):
                    # Linhas de IVA: múltiplas linhas possíveis
                    # Formato: I1=país, I2=base1, I3=base2, I4=iva1, I5=iva2, I6=taxa1, I7=base3, I8=iva3...
                    # OU: I1=país, I3=base1, I4=iva1, I7=base2, I8=iva2

                    numero_str = chave[1:]
                    try:
                        numero = int(numero_str)

                        # I1 geralmente é país
                        if numero == 1:
                            try:
                                float(valor)
                                # Se for número, tratar como base da linha 1
                                if '1' not in linhas_iva_temp:
                                    linhas_iva_temp['1'] = {}
                                linhas_iva_temp['1']['base_tributavel'] = float(valor)
                            except:
                                # É país - aplicar a todas as linhas
                                pass

                        # Pares de base/iva podem estar em diferentes formatos:
                        # Formato 1: I3/I4 = linha 1, I7/I8 = linha 2, I11/I12 = linha 3... (padrão antigo)
                        # Formato 2: I5/I6 = linha 1, I7/I8 = linha 2, I9/I10 = linha 3... (padrão novo)
                        # Verificar qual padrão é usado e mapear corretamente
                        elif numero >= 3:
                            # Tentar determinar o padrão baseado nos números ímpares/pares
                            # Se temos I5/I6, I7/I8, I9/I10... (pares consecutivos de ímpar/par)
                            # Se temos I3/I4, I7/I8, I11/I12... (pares com saltos de 4)

                            # Verificar se é par consecutivo (I5/I6, I7/I8, I9/I10...)
                            # Neste caso, ímpar é base, par seguinte é IVA
                            if numero % 2 == 1:  # Número ímpar (I5, I7, I9, I11...)
                                # Base tributável
                                # I5 = linha 1, I7 = linha 2, I9 = linha 3...
                                # OU I3 = linha 1, I7 = linha 2, I11 = linha 3...

                                # Tentar mapear baseado em ímpares >= 5
                                if numero >= 5:
                                    linha_num = str((numero - 5) // 2 + 1)
                                else:  # I3
                                    linha_num = str((numero - 3) // 4 + 1)

                                if linha_num not in linhas_iva_temp:
                                    linhas_iva_temp[linha_num] = {}

                                try:
                                    linhas_iva_temp[linha_num]['base_tributavel'] = float(valor)
                                except:
                                    pass

                            elif numero % 2 == 0:  # Número par (I4, I6, I8, I10...)
                                # Valor IVA
                                # I6 = linha 1, I8 = linha 2, I10 = linha 3...
                                # OU I4 = linha 1, I8 = linha 2, I12 = linha 3...

                                # Tentar mapear baseado em pares >= 6
                                if numero >= 6:
                                    linha_num = str((numero - 6) // 2 + 1)
                                else:  # I4
                                    linha_num = str((numero - 4) // 4 + 1)

                                if linha_num not in linhas_iva_temp:
                                    linhas_iva_temp[linha_num] = {}

                                try:
                                    linhas_iva_temp[linha_num]['valor_iva'] = float(valor)
                                except:
                                    pass
                    except:
                        pass
                        
                elif chave == 'N':
                    # N pode ser valor total OU retenção, dependendo da posição no QR
                    # Vamos guardar temporariamente e decidir depois
                    fatura['campo_n'] = float(valor)
                elif chave == 'O':
                    # O pode ser retenção OU valor total, dependendo da posição no QR
                    # Vamos guardar temporariamente e decidir depois
                    fatura['campo_o'] = float(valor) if valor else 0
                elif chave == 'P':
                    fatura['hash'] = valor
                elif chave == 'Q':
                    fatura['numero_certificado'] = valor
                elif chave == 'R':
                    fatura['outras_infos'] = valor
            
            # Converter linhas de IVA para lista e calcular taxa se necessário
            for num_linha in sorted(linhas_iva_temp.keys()):
                linha = linhas_iva_temp[num_linha]
                # If percentage is not explicitly set, but base and iva value are, try to calculate
                if ('base_tributavel' in linha and 'valor_iva' in linha and
                        ('taxa_iva_percentagem' not in linha or linha['taxa_iva_percentagem'] is None or linha['taxa_iva_percentagem'] == 0)):
                    base = float(linha['base_tributavel'])
                    iva_valor = float(linha['valor_iva'])
                    if base > 0:
                        calculated_taxa = round((iva_valor / base) * 100, 2) # Round to 2 decimal places
                        linha['taxa_iva_percentagem'] = calculated_taxa
                        # Assign a generic code if not present, e.g., 'CALC'
                        if 'taxa_iva_codigo' not in linha or linha['taxa_iva_codigo'] == 'OUT':
                            linha['taxa_iva_codigo'] = f"CALC({calculated_taxa}%)"
                    else:
                        # If base is 0, and iva_valor is 0, it's 0% IVA (exempt)
                        if iva_valor == 0:
                            linha['taxa_iva_percentagem'] = 0
                            linha['taxa_iva_codigo'] = 'ISE'
                fatura['linhas_iva'].append(linha)

            # Calcular valor total correto como base_tributavel + valor_iva
            total_base = 0
            total_iva = 0
            for linha in fatura['linhas_iva']:
                total_base += linha.get('base_tributavel', 0)
                total_iva += linha.get('valor_iva', 0)

            # Calcular o valor total esperado (base + IVA)
            valor_total_calculado = round(total_base + total_iva, 2)

            campo_n = fatura.get('campo_n', 0)
            campo_o = fatura.get('campo_o', 0)

            # Estratégia melhorada para determinar valor_total e IVA total:
            # 1. Se temos linhas de IVA válidas, o valor calculado é mais confiável
            # 2. Campo N geralmente é o IVA total ou valor total do documento
            # 3. Campo O pode ser o valor total, retenção, ou outros valores

            if len(fatura['linhas_iva']) > 0 and total_base > 0:
                # Temos linhas de IVA válidas - usar valor calculado como total
                fatura['valor_total'] = valor_total_calculado

                # Verificar se N ou O corresponde ao total de IVA
                if abs(campo_n - total_iva) < 0.01:
                    # N é o IVA total
                    fatura['total_iva_qr'] = campo_n
                    fatura['retencao_iva'] = campo_o if campo_o else 0
                elif abs(campo_o - total_iva) < 0.01:
                    # O é o IVA total
                    fatura['total_iva_qr'] = campo_o
                    fatura['retencao_iva'] = campo_n if campo_n else 0
                else:
                    # Nenhum corresponde ao IVA - guardar ambos para referência
                    fatura['campo_n_original'] = campo_n
                    fatura['campo_o_original'] = campo_o
                    fatura['retencao_iva'] = 0
            else:
                # Sem linhas de IVA válidas - usar lógica antiga
                # Comparar qual dos campos está mais próximo do valor calculado
                if abs(campo_n - valor_total_calculado) < abs(campo_o - valor_total_calculado):
                    fatura['valor_total'] = campo_n
                    fatura['retencao_iva'] = campo_o
                else:
                    fatura['valor_total'] = campo_o
                    fatura['retencao_iva'] = campo_n

            # Adicionar campos auxiliares para debug/verificação
            fatura['total_base_calculado'] = round(total_base, 2)
            fatura['total_iva_calculado'] = round(total_iva, 2)

            # Remover campos temporários
            fatura.pop('campo_n', None)
            fatura.pop('campo_o', None)

            return fatura
            
        except Exception as e:
            print(f"Erro ao descodificar QR: {e}", file=sys.stderr)
            return {'erro': str(e), 'raw_data': dados_qr}
    
    def processar_fatura(self, caminho_imagem: str) -> Optional[Dict]:
        """
        Processa uma imagem de fatura: lê o QR e descodifica os dados
        
        Args:
            caminho_imagem: Caminho para a imagem da fatura
            
        Returns:
            Dicionário com os dados da fatura ou None se falhar
        """
        print(f"A processar: {caminho_imagem}", file=sys.stderr)
        
        # Ler QR code
        dados_qr = self.ler_qr_de_imagem(caminho_imagem)
        
        if not dados_qr:
            return None
        
        print(f"QR Code encontrado! Tamanho: {len(dados_qr)} caracteres", file=sys.stderr)
        
        # Descodificar dados
        fatura = self.descodificar_qr_fatura(dados_qr)
        
        return fatura
    
    def formatar_fatura(self, fatura: Dict) -> str:
        """
        Formata os dados da fatura para apresentação legível
        
        Args:
            fatura: Dicionário com os dados da fatura
            
        Returns:
            String formatada com os dados da fatura
        """
        if 'erro' in fatura:
            return f"ERRO: {fatura['erro']}\nDados brutos: {fatura.get('raw_data', 'N/A')}"
        
        linhas = [
            "="*60,
            "DADOS DA FATURA (extraídos do QR Code AT)",
            "="*60,
            f"NIF Emitente: {fatura.get('nif_emitente', 'N/A')}",
            f"NIF Adquirente: {fatura.get('nif_adquirente', 'N/A')}",
            f"País Adquirente: {fatura.get('pais_adquirente', 'N/A')}",
            f"Tipo de Documento: {fatura.get('tipo_documento', 'N/A')}",
            f"Estado: {fatura.get('estado_documento', 'N/A')}",
            f"Data de Emissão: {fatura.get('data_emissao', 'N/A')}",
            f"Número do Documento: {fatura.get('numero_documento', 'N/A')}",
            f"ATCUD: {fatura.get('atcud', 'N/A')}",
            "-"*60,
            "RESUMO IVA:",
        ]
        
        for i, linha_iva in enumerate(fatura.get('linhas_iva', []), 1):
            linhas.append(f"  Linha {i}:")
            linhas.append(f"    Base Tributável: {linha_iva.get('base_tributavel', 'N/A')}€")
            linhas.append(f"    Valor IVA: {linha_iva.get('valor_iva', 'N/A')}€")
            linhas.append(f"    Taxa: {linha_iva.get('taxa_iva_codigo', 'N/A')} ({linha_iva.get('taxa_iva_percentagem', 'N/A')}%) ")
        
        linhas.extend([
            "-"*60,
            f"VALOR TOTAL: {fatura.get('valor_total', 'N/A')}€",
            f"Retenção IVA: {fatura.get('retencao_iva', 0)}€",
            "-"*60,
            f"Hash: {fatura.get('hash', 'N/A')}",
            f"Certificado Nº: {fatura.get('numero_certificado', 'N/A')}",
            "="*60
        ])
        
        return "\n".join(linhas)
    
    def exportar_json(self, fatura: Dict, caminho_saida: str):
        """
        Exporta os dados da fatura para JSON
        
        Args:
            fatura: Dicionário com os dados da fatura
            caminho_saida: Caminho para o ficheiro JSON de saída
        """
        try:
            with open(caminho_saida, 'w', encoding='utf-8') as f:
                json.dump(fatura, f, ensure_ascii=False, indent=2)
            print(f"Dados exportados para: {caminho_saida}", file=sys.stderr)
        except Exception as e:
            print(f"Erro ao exportar JSON: {e}", file=sys.stderr)


def main():
    """
    Função principal que lê a imagem de um ficheiro e escreve o resultado JSON para ficheiro.
    """
    leitor = LeitorQRFaturaAT()
    fatura = None
    image_path = None
    output_path = None

    try:
        # Verificar argumentos da linha de comando
        if len(sys.argv) < 2:
            print(json.dumps({"error": "Utilização: python script.py <image_path> [--json <output_path>]"}))
            sys.exit(1)

        image_path = sys.argv[1]

        # Verificar se a imagem existe
        if not os.path.exists(image_path):
            print(json.dumps({"error": f"Ficheiro de imagem não encontrado: {image_path}"}))
            sys.exit(1)

        # Processar a fatura a partir do ficheiro
        fatura = leitor.processar_fatura(image_path)

        if fatura:
            # Se houver um caminho de saída JSON, escrever para ficheiro
            if len(sys.argv) >= 4 and sys.argv[2] == '--json':
                output_path = sys.argv[3]
                try:
                    with open(output_path, 'w', encoding='utf-8') as f:
                        json.dump(fatura, f, ensure_ascii=False, indent=2)
                    print(json.dumps({"success": "QR code processado com sucesso"}), file=sys.stderr)
                except Exception as e:
                    print(json.dumps({"error": f"Erro ao escrever ficheiro JSON: {str(e)}"}))
                    sys.exit(1)
            else:
                # Se não houver caminho de saída, escrever para stdout
                print(json.dumps(fatura, ensure_ascii=False))
        else:
            # Retornar um erro JSON se a fatura não for processada
            print(json.dumps({"error": "QR Code não encontrado ou ilegível na imagem."}))
            sys.exit(1)

    except Exception as e:
        # Capturar exceções e retornar um erro JSON
        print(json.dumps({"error": f"Ocorreu um erro inesperado no script Python: {str(e)}"}))
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

"""
Leitor de QR Code de Faturas Portuguesas (AT)
Extrai e descodifica informação estruturada dos códigos QR das faturas emitidas em Portugal
"""

import cv2
from pyzbar import pyzbar
import json
from datetime import datetime
from typing import Dict, Optional, List
import sys


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
    
    def ler_qr_de_imagem(self, caminho_imagem: str) -> Optional[str]:
        """
        Lê o código QR de uma imagem de fatura

        Args:
            caminho_imagem: Caminho para o ficheiro de imagem

        Returns:
            String com os dados do QR ou None se não encontrar
        """
        try:
            print(f"Lendo imagem: {caminho_imagem}")
            # Ler a imagem
            imagem = cv2.imread(caminho_imagem)

            if imagem is None:
                print(f"Erro: Não foi possível ler a imagem {caminho_imagem}")
                return None

            print(f"Imagem carregada com sucesso. Dimensões: {imagem.shape}")

            # Tentar detectar com imagem original
            print("Tentando detectar QR na imagem original...")
            codigos_qr = pyzbar.decode(imagem)

            # Se não encontrar, tentar processar a imagem
            if not codigos_qr:
                print("QR não encontrado na imagem original. Tentando com processamento...")
                # Converter para escala de cinzas
                cinzenta = cv2.cvtColor(imagem, cv2.COLOR_BGR2GRAY)
                codigos_qr = pyzbar.decode(cinzenta)

            # Se ainda não encontrar, tentar com contraste aumentado
            if not codigos_qr:
                print("Tentando com contraste aumentado...")
                cinzenta = cv2.cvtColor(imagem, cv2.COLOR_BGR2GRAY)
                # Aumentar contraste
                clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
                contraste = clahe.apply(cinzenta)
                codigos_qr = pyzbar.decode(contraste)

            if not codigos_qr:
                print("⚠ Nenhum código QR encontrado na imagem")
                print("Dica: Certifique-se de que:")
                print("  - O QR code está visível e legível")
                print("  - A imagem tem boa qualidade")
                print("  - O QR não está cortado ou muito distorcido")
                return None

            print(f"✓ {len(codigos_qr)} código(s) QR encontrado(s)")

            # Retornar o primeiro código QR encontrado
            dados_qr = codigos_qr[0].data.decode('utf-8')
            print(f"Dados do QR (primeiros 100 chars): {dados_qr[:100]}...")
            return dados_qr

        except Exception as e:
            print(f"Erro ao ler QR code: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def descodificar_qr_fatura(self, dados_qr: str) -> Dict:
        """
        Descodifica os dados do QR code de uma fatura portuguesa
        
        Formato esperado (separado por asteriscos):
        A:NIF_Emitente*B:NIF_Adquirente*C:País*D:TipoDoc*E:Estado*F:DataEmissão*G:NumDoc*H:ATCUD*I1:PT*I2:ValorBase*I3:ValorIVA*I4:TaxaIVA*...*N:ValorTotal*O:Retencao*P:Hash*Q:CertificadoNum*R:OutrasInfos
        
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
                    # Linhas de IVA (I1, I2, I3, I4...)
                    # I1 = país, I2 = base tributável, I3 = total IVA, I4 = taxa IVA (ISE, RED, etc)
                    num_linha = chave[1] if len(chave) > 1 else '1'
                    
                    if num_linha not in linhas_iva_temp:
                        linhas_iva_temp[num_linha] = {}
                    
                    # I seguido de número e depois subcampo
                    if len(chave) > 2:
                        subcampo = chave[2:]
                        if subcampo == '1':
                            linhas_iva_temp[num_linha]['pais'] = valor
                        elif subcampo == '2':
                            linhas_iva_temp[num_linha]['base_tributavel'] = float(valor)
                        elif subcampo == '3':
                            linhas_iva_temp[num_linha]['valor_iva'] = float(valor)
                        elif subcampo == '4':
                            linhas_iva_temp[num_linha]['taxa_iva_codigo'] = valor
                            linhas_iva_temp[num_linha]['taxa_iva_percentagem'] = self.taxas_iva_pt.get(valor, 0)
                    else:
                        # Apenas I seguido de número - pode ser formato alternativo
                        linhas_iva_temp[num_linha]['info'] = valor
                        
                elif chave == 'N':
                    fatura['valor_total'] = float(valor)
                elif chave == 'O':
                    fatura['retencao_iva'] = float(valor) if valor else 0
                elif chave == 'P':
                    fatura['hash'] = valor
                elif chave == 'Q':
                    fatura['numero_certificado'] = valor
                elif chave == 'R':
                    fatura['outras_infos'] = valor
            
            # Converter linhas de IVA para lista
            for num_linha in sorted(linhas_iva_temp.keys()):
                fatura['linhas_iva'].append(linhas_iva_temp[num_linha])
            
            return fatura
            
        except Exception as e:
            print(f"Erro ao descodificar QR: {e}")
            return {'erro': str(e), 'raw_data': dados_qr}
    
    def processar_fatura(self, caminho_imagem: str) -> Optional[Dict]:
        """
        Processa uma imagem de fatura: lê o QR e descodifica os dados
        
        Args:
            caminho_imagem: Caminho para a imagem da fatura
            
        Returns:
            Dicionário com os dados da fatura ou None se falhar
        """
        print(f"A processar: {caminho_imagem}")
        
        # Ler QR code
        dados_qr = self.ler_qr_de_imagem(caminho_imagem)
        
        if not dados_qr:
            return None
        
        print(f"QR Code encontrado! Tamanho: {len(dados_qr)} caracteres")
        
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
            linhas.append(f"    Taxa: {linha_iva.get('taxa_iva_codigo', 'N/A')} ({linha_iva.get('taxa_iva_percentagem', 'N/A')}%)")
        
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
            print(f"Dados exportados para: {caminho_saida}")
        except Exception as e:
            print(f"Erro ao exportar JSON: {e}")


def main():
    """Função principal para uso via linha de comandos"""
    if len(sys.argv) < 2:
        print("Uso: python leitor_qr_faturas_at.py <caminho_imagem> [--json <saída.json>]")
        print("\nExemplo:")
        print("  python leitor_qr_faturas_at.py fatura.jpg")
        print("  python leitor_qr_faturas_at.py fatura.jpg --json dados_fatura.json")
        sys.exit(1)
    
    caminho_imagem = sys.argv[1]
    caminho_json = None
    
    # Verificar se foi pedido export JSON
    if '--json' in sys.argv:
        idx = sys.argv.index('--json')
        if idx + 1 < len(sys.argv):
            caminho_json = sys.argv[idx + 1]
    
    # Processar fatura
    leitor = LeitorQRFaturaAT()
    fatura = leitor.processar_fatura(caminho_imagem)
    
    if fatura:
        # Mostrar dados formatados
        print("\n" + leitor.formatar_fatura(fatura))
        
        # Exportar JSON se pedido
        if caminho_json:
            leitor.exportar_json(fatura, caminho_json)
    else:
        print("Não foi possível processar a fatura.")
        sys.exit(1)


if __name__ == "__main__":
    main()

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Upload, FileSpreadsheet, ExternalLink, Download } from 'lucide-react';
import { useImportExcel } from '@/hooks/useFiscalData';
import * as XLSX from 'xlsx';

export const ExcelUpload = () => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importMutation = useImportExcel();

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Transform data to match expected structure with flexible parsing
      const processedData = jsonData.map((row: any) => {
        // Helper function to safely parse numbers
        const parseNumber = (value: any): number | null => {
          if (value === null || value === undefined || value === '') return null;
          const parsed = parseFloat(String(value).replace(/[^\d.,-]/g, '').replace(',', '.'));
          return isNaN(parsed) ? null : parsed;
        };

        // Helper function to parse company status
        const parseSemMovimento = (value: any): boolean => {
          if (value === null || value === undefined || value === '') return false; // Default: ativa
          const str = String(value).toLowerCase().trim();
          return str === 'paralizada' || str === 'sem movimento' || str === 'paralisada';
        };

        return {
          empresa: String(row.Empresa || row.empresa || '').trim(),
          cnpj: String(row.CNPJ || row.cnpj || '').replace(/\D/g, ''),
          periodo: String(row.Período || row.periodo || row.Periodo || '').trim(),
          rbt12: parseNumber(row.RBT12 || row.rbt12),
          entrada: parseNumber(row.entrada || row.Entrada),
          saida: parseNumber(row.saída || row.saida || row.Saída || row.Saida),
          imposto: parseNumber(row.imposto || row.Imposto),
          sem_movimento: parseSemMovimento(row['situação'] || row['Situação'] || row['situacao'] || row['Situacao'] || row['status'] || row['Status']),
        };
      });

      // Check if we have any valid rows (only empresa is required)
      const validRowsCount = processedData.filter(row => 
        row.empresa && row.empresa.trim() !== ''
      ).length;

      if (validRowsCount === 0) {
        alert('Nenhum dado válido encontrado no arquivo. Verifique se a coluna Empresa está preenchida.');
        return;
      }

      await importMutation.mutateAsync(processedData);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Erro ao processar o arquivo. Verifique se é um arquivo Excel válido.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleExtractionToolClick = () => {
    window.open('https://extracao.streamlit.app/', '_blank');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileSpreadsheet className="h-6 w-6" />
            Importar Dados do Excel
          </CardTitle>
        </CardHeader>
        <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">
            Arraste e solte seu arquivo Excel aqui
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            ou clique para selecionar um arquivo (.xlsx, .xls)
          </p>
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={importMutation.isPending}
          >
            {importMutation.isPending ? 'Importando...' : 'Selecionar Arquivo'}
          </Button>
          <Input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold mb-2">Formato aceito:</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>Colunas:</strong> Empresa, CNPJ, Período, RBT12, entrada, saída, imposto, situação</p>
            <p><strong>Flexível:</strong> Valores em branco são aceitos e tratados como null</p>
            <p><strong>Obrigatório:</strong> Apenas o nome da Empresa é campo obrigatório</p>
            <p><strong>Situação:</strong> Use "Paralizada" ou "Sem movimento" para empresas sem movimento. "Ativa" ou vazio será considerado como empresa ativa</p>
          </div>
        </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Download className="h-6 w-6" />
            Extrair Dados de Documentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Use nossa ferramenta de extração para processar documentos fiscais e gerar planilhas automaticamente.
            </p>
            <div className="flex justify-start">
              <Button 
                onClick={handleExtractionToolClick}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir Ferramenta de Extração
              </Button>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">Como usar:</h4>
              <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                <li>Clique no botão acima para abrir a ferramenta</li>
                <li>Faça upload dos seus documentos fiscais</li>
                <li>A ferramenta extrairá os dados automaticamente</li>
                <li>Baixe a planilha gerada</li>
                <li>Volte aqui e importe a planilha usando o formulário acima</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
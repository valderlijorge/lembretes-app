"use client";

import { useState, useEffect } from "react";
import { storageService } from "@/lib/storage";

export default function DataExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [storageInfoState, setStorageInfoState] = useState<{
    type: string;
    available: boolean;
    itemCount: number;
  }>({ type: 'localStorage', available: true, itemCount: 0 });

  useEffect(() => {
    const loadStorageInfo = async () => {
      const info = await storageService.getStorageInfo();
      setStorageInfoState(info);
    };
    loadStorageInfo();
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exportData = await storageService.exportData();
      
      // Criar blob e download
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lembretes-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      setImportStatus({
        success: false,
        message: 'Erro ao exportar dados'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus(null);

    try {
      const text = await file.text();
      const result = await storageService.importData(text);
      
      setImportStatus({
        success: result.success,
        message: result.message
      });

      // Recarregar a página se importação foi bem-sucedida
      if (result.success) {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      console.error('Import failed:', error);
      setImportStatus({
        success: false,
        message: 'Erro ao ler arquivo'
      });
    } finally {
      setIsImporting(false);
      // Limpar o input para permitir importar o mesmo arquivo novamente
      event.target.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Gerenciamento de Dados</h3>
          <div className="text-sm text-gray-600">
            <p>Storage: <span className="font-medium">{storageInfoState.type}</span></p>
            <p>Total de lembretes: <span className="font-medium">{storageInfoState?.itemCount || 0}</span></p>
            {!storageInfoState.available && (
              <p className="text-orange-600">⚠️ Storage indisponível no momento</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            disabled={isExporting || storageInfoState.itemCount === 0}
            className={`
              px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm
              ${isExporting || storageInfoState.itemCount === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-500 text-white hover:bg-green-600 hover:shadow-md'
              }
            `}
          >
            {isExporting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4" 
                    fill="none"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Exportando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Exportar Dados
              </span>
            )}
          </button>

          <label className={`
            px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm cursor-pointer
            ${isImporting
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md'
            }
          `}>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={isImporting}
              className="hidden"
            />
            {isImporting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4" 
                    fill="none"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Importando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                Importar Dados
              </span>
            )}
          </label>
        </div>

        {/* Import Status */}
        {importStatus && (
          <div className={`
            p-3 rounded-lg text-sm fade-in
            ${importStatus.success 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
            }
          `}>
            <div className="flex items-center gap-2">
              {importStatus.success ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              {importStatus.message}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
          <p className="font-medium mb-1">ℹ️ Informações:</p>
          <ul className="space-y-1">
            <li>• <strong>Exportar:</strong> Baixe seus lembretes como backup</li>
            <li>• <strong>Importar:</strong> Restaure lembretes de um arquivo JSON</li>
            <li>• A importação substituirá todos os dados atuais</li>
            <li>• Formato compatível com localStorage original</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
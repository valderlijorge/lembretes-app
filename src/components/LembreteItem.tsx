'use client';

import { useState } from 'react';
import { Lembrete } from '@/types/lembrete';

interface LembreteItemProps {
  lembrete: Lembrete;
  onToggleConcluido: (id: string) => void;
  onEditar: (lembrete: Lembrete) => void;
  onConfirmarDelecao: (id: string) => void;
}

export default function LembreteItem({ 
  lembrete, 
  onToggleConcluido, 
  onEditar, 
  onConfirmarDelecao 
}: LembreteItemProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    setIsAnimating(true);
    onToggleConcluido(lembrete.id);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const formatarData = (data: Date) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  return (
    <div 
      className={`
        relative flex items-center gap-3 p-4 border rounded-lg transition-all duration-300 ease-in-out
        ${lembrete.concluido 
          ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-l-4 border-green-500 opacity-60 scale-95 lembrete-concluido' 
          : 'bg-white border-gray-300 lembrete-hover'
        }
        ${isAnimating ? 'check-animation' : ''}
      `}
    >
      <div className="relative">
        <input
          type="checkbox"
          checked={lembrete.concluido}
          onChange={handleToggle}
          className={`
            w-6 h-6 rounded focus:ring-2 checkbox-custom
            ${lembrete.concluido 
              ? 'text-green-500 focus:ring-green-500' 
              : 'text-blue-500 focus:ring-blue-500'
            }
          `}
        />
        {lembrete.concluido && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg 
              className="w-4 h-4 text-green-600" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`
            truncate
            ${lembrete.concluido 
              ? 'line-through text-gray-400 italic' 
              : 'text-gray-900'
            }
          `}>
            {lembrete.texto}
          </p>
          {lembrete.concluido && (
            <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
              ✓ Concluído
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-gray-500">
            Criado em {formatarData(lembrete.criadoEm)}
          </p>
          {lembrete.concluido && lembrete.concluidoEm && (
            <>
              <span className="text-gray-400">•</span>
              <p className="text-xs text-green-600">
                Concluído em {formatarData(lembrete.concluidoEm)}
              </p>
            </>
          )}
        </div>
      </div>
      
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => onEditar(lembrete)}
          disabled={lembrete.concluido}
          className={`
            px-3 py-1 text-sm rounded transition-all duration-200
            ${lembrete.concluido 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-yellow-500 text-white hover:bg-yellow-600 hover:shadow-md'
            }
          `}
          title={lembrete.concluido ? "Não é possível editar lembretes concluídos" : "Editar lembrete"}
        >
          Editar
        </button>
        <button
          onClick={() => onConfirmarDelecao(lembrete.id)}
          className={`
            px-3 py-1 text-sm rounded transition-all duration-200
            ${lembrete.concluido 
              ? 'bg-red-400 text-white hover:bg-red-500' 
              : 'bg-red-500 text-white hover:bg-red-600 hover:shadow-md'
            }
          `}
          title="Deletar lembrete"
        >
          Deletar
        </button>
      </div>
    </div>
  );
}
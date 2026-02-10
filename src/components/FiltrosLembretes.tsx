'use client';

interface FiltrosLembretesProps {
  mostrarConcluidos: boolean;
  setMostrarConcluidos: (mostrar: boolean) => void;
  ordenarPor: 'recentes' | 'status';
  setOrdenarPor: (ordenar: 'recentes' | 'status') => void;
  totalLembretes: number;
  lembretesConcluidos: number;
}

export default function FiltrosLembretes({
  mostrarConcluidos,
  setMostrarConcluidos,
  ordenarPor,
  setOrdenarPor,
  totalLembretes,
  lembretesConcluidos
}: FiltrosLembretesProps) {
  const percentualConcluido = totalLembretes > 0 
    ? Math.round((lembretesConcluidos / totalLembretes) * 100) 
    : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      {/* Estatísticas */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-gray-600">Total:</span>
            <span className="ml-1 font-semibold text-gray-900">{totalLembretes}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">Concluídos:</span>
            <span className="ml-1 font-semibold text-green-600">{lembretesConcluidos}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">Progresso:</span>
            <span className="ml-1 font-semibold text-blue-600">{percentualConcluido}%</span>
          </div>
        </div>
        
        {/* Barra de progresso */}
        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 ease-out"
            style={{ width: `${percentualConcluido}%` }}
          />
        </div>
      </div>

      {/* Filtros e ordenação */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMostrarConcluidos(!mostrarConcluidos)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200
              ${mostrarConcluidos 
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }
            `}
          >
            {mostrarConcluidos ? 'Ocultar Concluídos' : 'Mostrar Concluídos'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Ordenar por:</span>
          <div className="flex gap-1">
            <button
              onClick={() => setOrdenarPor('recentes')}
              className={`
                px-3 py-1 text-sm rounded-md transition-colors duration-200
                ${ordenarPor === 'recentes' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }
              `}
            >
              Mais Recentes
            </button>
            <button
              onClick={() => setOrdenarPor('status')}
              className={`
                px-3 py-1 text-sm rounded-md transition-colors duration-200
                ${ordenarPor === 'status' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }
              `}
            >
              Por Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
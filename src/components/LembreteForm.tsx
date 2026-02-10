"use client";

import { useState, useEffect } from "react";
import { Lembrete } from "@/types/lembrete";

interface LembreteFormProps {
  onAdicionarLembrete: (texto: string) => void;
  lembreteEditando?: Lembrete | null;
  onEditarLembrete: (id: string, texto: string) => void;
  onCancelarEdicao: () => void;
  verificarDuplicata: (texto: string, editandoId?: string) => boolean;
}

export default function LembreteForm({
  onAdicionarLembrete,
  lembreteEditando,
  onEditarLembrete,
  onCancelarEdicao,
  verificarDuplicata,
}: LembreteFormProps) {
  const [texto, setTexto] = useState(lembreteEditando?.texto || "");
  const [erro, setErro] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTexto(lembreteEditando?.texto || "");
    setErro("");
  }, [lembreteEditando]);

  const validarTexto = (texto: string): string => {
    if (!texto.trim()) return "O lembrete não pode estar vazio";
    if (texto.trim().length < 3) return "O lembrete deve ter pelo menos 3 caracteres";
    if (texto.trim().length > 200) return "O lembrete deve ter no máximo 200 caracteres";
    if (verificarDuplicata(texto, lembreteEditando?.id)) return "Já existe um lembrete com este texto";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const erroValidacao = validarTexto(texto);
    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    setErro("");
    setIsSubmitting(true);

    try {
      // Simular uma pequena demora para feedback visual
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (lembreteEditando) {
        onEditarLembrete(lembreteEditando.id, texto.trim());
      } else {
        onAdicionarLembrete(texto.trim());
      }
      
      if (!lembreteEditando) {
        setTexto("");
      }
    } catch (error) {
      setErro("Ocorreu um erro. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTexto(e.target.value);
    if (erro) setErro("");
  };

  const handleCancel = () => {
    setTexto("");
    setErro("");
    onCancelarEdicao();
  };

  const caracteresRestantes = 200 - texto.trim().length;
  const showCharCount = texto.length > 0;

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="space-y-3">
          {/* Input principal */}
          <div className="relative">
            <input
              type="text"
              value={texto}
              onChange={handleInputChange}
              placeholder={lembreteEditando ? "Edite seu lembrete..." : "Digite um novo lembrete..."}
              disabled={isSubmitting}
              className={`
                w-full px-4 py-3 rounded-lg border transition-all duration-200
                ${erro 
                  ? 'border-red-400 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }
                ${isSubmitting ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
                focus:outline-none focus:ring-2
              `}
              maxLength={200}
            />
            
            {/* Indicador de caracteres */}
            {showCharCount && (
              <div className={`
                absolute right-3 top-1/2 transform -translate-y-1/2 text-xs
                ${caracteresRestantes < 20 ? 'text-orange-500' : 'text-gray-400'}
              `}>
                {caracteresRestantes}
              </div>
            )}
          </div>

          {/* Mensagem de erro */}
          {erro && (
            <div className="flex items-center gap-2 text-red-600 text-sm fade-in">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path 
                  fillRule="evenodd" 
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
                  clipRule="evenodd" 
                />
              </svg>
              {erro}
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting || !texto.trim()}
              className={`
                px-6 py-2 rounded-lg font-medium transition-all duration-200
                ${isSubmitting || !texto.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : lembreteEditando 
                    ? 'bg-yellow-500 text-white hover:bg-yellow-600 hover:shadow-md' 
                    : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md'
                }
              `}
            >
              {isSubmitting ? (
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
                  {lembreteEditando ? "Atualizando..." : "Adicionando..."}
                </span>
              ) : (
                <>
                  {lembreteEditando ? (
                    <>
                      <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      Atualizar
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Adicionar
                    </>
                  )}
                </>
              )}
            </button>
            
            {lembreteEditando && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className={`
                  px-6 py-2 rounded-lg font-medium transition-all duration-200
                  ${isSubmitting
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-500 text-white hover:bg-gray-600 hover:shadow-md'
                  }
                `}
              >
                <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Cancelar
              </button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}

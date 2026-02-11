"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Lembrete } from "@/types/lembrete";
import {
  createLembrete,
  updateLembrete,
  deleteLembrete,
} from "@/lib/actions/lembretes.actions";
import LembreteForm from "@/components/LembreteForm";
import LembreteItem from "@/components/LembreteItem";
import FiltrosLembretes from "@/components/FiltrosLembretes";
import Toast from "@/components/Toast";
import ConfirmacaoModal from "@/components/ConfirmacaoModal";

interface HomeClientProps {
  initialLembretes: Lembrete[];
  error: string | null;
}

export default function HomeClient({
  initialLembretes,
  error,
}: HomeClientProps) {
  const [lembretes, setLembretes] = useState<Lembrete[]>(initialLembretes);
  const [lembreteEditando, setLembreteEditando] = useState<Lembrete | null>(
    null
  );
  const [mostrarConcluidos, setMostrarConcluidos] = useState(true);
  const [ordenarPor, setOrdenarPor] = useState<"recentes" | "status">(
    "recentes"
  );
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [lembreteParaDeletar, setLembreteParaDeletar] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  // Ref para evitar múltiplas operações simultâneas
  const operationInProgress = useRef(false);

  // Auto-dismiss toast após 3 segundos
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const mostrarToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setToast({ message, type });
    },
    []
  );

  const verificarDuplicata = useCallback(
    (texto: string, editandoId?: string): boolean => {
      const textoNormalizado = texto.toLowerCase().trim();
      return lembretes.some(
        (lembrete) =>
          lembrete.texto.toLowerCase().trim() === textoNormalizado &&
          lembrete.id !== editandoId
      );
    },
    [lembretes]
  );

  const adicionarLembrete = useCallback(
    async (texto: string) => {
      if (operationInProgress.current) {
        mostrarToast("Aguarde a operação anterior finalizar", "error");
        return;
      }

      operationInProgress.current = true;
      setIsLoading(true);

      try {
        const novoLembrete = await createLembrete(texto.trim());

        setLembretes((prev) => [novoLembrete, ...prev]);
        mostrarToast("Lembrete adicionado com sucesso!");
      } catch (error) {
        console.error("Erro ao adicionar lembrete:", error);
        mostrarToast(
          error instanceof Error ? error.message : "Erro ao adicionar lembrete",
          "error"
        );
      } finally {
        setIsLoading(false);
        operationInProgress.current = false;
      }
    },
    [mostrarToast]
  );

  const toggleConcluido = useCallback(
    async (id: string) => {
      if (operationInProgress.current) {
        return;
      }

      operationInProgress.current = true;
      setIsLoading(true);

      try {
        const lembrete = lembretes.find((l) => l.id === id);
        if (!lembrete) {
          throw new Error("Lembrete não encontrado");
        }

        const novoEstado = !lembrete.concluido;
        const updatedLembrete = await updateLembrete(id, {
          concluido: novoEstado,
          concluidoEm: novoEstado ? new Date() : undefined,
        });

        if (updatedLembrete) {
          setLembretes((prev) =>
            prev.map((l) => (l.id === id ? updatedLembrete : l))
          );
        }
      } catch (error) {
        console.error("Erro ao atualizar lembrete:", error);
        mostrarToast(
          error instanceof Error ? error.message : "Erro ao atualizar lembrete",
          "error"
        );

        // Reverter estado otimista em caso de erro
        setLembretes((prev) => [...prev]);
      } finally {
        setIsLoading(false);
        operationInProgress.current = false;
      }
    },
    [lembretes, mostrarToast]
  );

  const editarLembrete = useCallback(
    async (id: string, texto: string) => {
      if (operationInProgress.current) {
        mostrarToast("Aguarde a operação anterior finalizar", "error");
        return;
      }

      operationInProgress.current = true;
      setIsLoading(true);

      try {
        const updatedLembrete = await updateLembrete(id, {
          texto: texto.trim(),
        });

        if (updatedLembrete) {
          setLembretes((prev) =>
            prev.map((lembrete) =>
              lembrete.id === id ? updatedLembrete : lembrete
            )
          );
          setLembreteEditando(null);
          mostrarToast("Lembrete atualizado com sucesso!");
        } else {
          throw new Error("Lembrete não encontrado");
        }
      } catch (error) {
        console.error("Erro ao editar lembrete:", error);
        mostrarToast(
          error instanceof Error ? error.message : "Erro ao editar lembrete",
          "error"
        );
      } finally {
        setIsLoading(false);
        operationInProgress.current = false;
      }
    },
    [mostrarToast]
  );

  const deletarLembrete = useCallback(
    async (id: string) => {
      if (operationInProgress.current) {
        mostrarToast("Aguarde a operação anterior finalizar", "error");
        return;
      }

      operationInProgress.current = true;
      setIsLoading(true);

      try {
        const success = await deleteLembrete(id);

        if (success) {
          setLembretes((prev) => prev.filter((lembrete) => lembrete.id !== id));
          mostrarToast("Lembrete deletado com sucesso!");
        } else {
          throw new Error("Falha ao deletar lembrete");
        }
      } catch (error) {
        console.error("Erro ao deletar lembrete:", error);
        mostrarToast(
          error instanceof Error ? error.message : "Erro ao deletar lembrete",
          "error"
        );
      } finally {
        setIsLoading(false);
        operationInProgress.current = false;
      }
    },
    [mostrarToast]
  );

  const iniciarEdicao = useCallback((lembrete: Lembrete) => {
    setLembreteEditando(lembrete);
  }, []);

  const cancelarEdicao = useCallback(() => {
    setLembreteEditando(null);
  }, []);

  const confirmarDelecao = useCallback(async () => {
    if (lembreteParaDeletar) {
      await deletarLembrete(lembreteParaDeletar);
      setLembreteParaDeletar(null);
    }
  }, [lembreteParaDeletar, deletarLembrete]);

  const cancelarDelecao = useCallback(() => {
    setLembreteParaDeletar(null);
  }, []);

  const filtrarEOrdenarLembretes = useCallback(() => {
    let filtrados = mostrarConcluidos
      ? lembretes
      : lembretes.filter((lembrete) => !lembrete.concluido);

    if (ordenarPor === "status") {
      filtrados = [...filtrados].sort((a, b) => {
        if (a.concluido === b.concluido) {
          return (
            new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
          );
        }
        return a.concluido ? 1 : -1;
      });
    } else {
      filtrados = [...filtrados].sort(
        (a, b) =>
          new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
      );
    }

    return filtrados;
  }, [lembretes, mostrarConcluidos, ordenarPor]);

  const lembretesFiltrados = filtrarEOrdenarLembretes();
  const lembretesConcluidos = lembretes.filter((l) => l.concluido).length;
  const progressoPercentual =
    lembretes.length > 0
      ? Math.round((lembretesConcluidos / lembretes.length) * 100)
      : 0;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Erro ao carregar lembretes
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Meus Lembretes
          </h1>
          <p className="text-gray-600">
            Organize suas tarefas e mantenha tudo em dia
          </p>
        </div>

        <LembreteForm
          key={lembreteEditando?.id}
          onAdicionarLembrete={adicionarLembrete}
          lembreteEditando={lembreteEditando}
          onEditarLembrete={editarLembrete}
          onCancelarEdicao={cancelarEdicao}
          verificarDuplicata={verificarDuplicata}
        />

        {/* Filtros */}
        {lembretes.length > 0 && (
          <FiltrosLembretes
            mostrarConcluidos={mostrarConcluidos}
            setMostrarConcluidos={setMostrarConcluidos}
            ordenarPor={ordenarPor}
            setOrdenarPor={setOrdenarPor}
            totalLembretes={lembretes.length}
            lembretesConcluidos={lembretesConcluidos}
          />
        )}

        {/* Lista de lembretes */}
        <div className="space-y-2">
          {lembretesFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {lembretes.length === 0
                  ? "Nenhum lembrete cadastrado"
                  : "Nenhum lembrete para mostrar"}
              </h3>
              <p className="text-gray-600">
                {lembretes.length === 0
                  ? "Adicione seu primeiro lembrete acima!"
                  : !mostrarConcluidos
                  ? "Tente mostrar os lembretes concluídos"
                  : "Adicione novos lembretes para começar"}
              </p>
            </div>
          ) : (
            <>
              {/* Separador visual para ordenação por status */}
              {ordenarPor === "status" && mostrarConcluidos ? (
                <>
                  <div className="space-y-2">
                    {lembretesFiltrados
                      .filter((l) => !l.concluido)
                      .map((lembrete) => (
                        <LembreteItem
                          key={lembrete.id}
                          lembrete={lembrete}
                          onToggleConcluido={toggleConcluido}
                          onEditar={iniciarEdicao}
                          onConfirmarDelecao={setLembreteParaDeletar}
                        />
                      ))}
                  </div>

                  {lembretesFiltrados.some((l) => !l.concluido) &&
                    lembretesFiltrados.some((l) => l.concluido) && (
                      <div className="my-6 flex items-center gap-4">
                        <div className="flex-1 h-px bg-gray-300"></div>
                        <span className="text-sm text-gray-500 font-medium">
                          Lembretes Concluídos
                        </span>
                        <div className="flex-1 h-px bg-gray-300"></div>
                      </div>
                    )}

                  <div className="space-y-2">
                    {lembretesFiltrados
                      .filter((l) => l.concluido)
                      .map((lembrete) => (
                        <LembreteItem
                          key={lembrete.id}
                          lembrete={lembrete}
                          onToggleConcluido={toggleConcluido}
                          onEditar={iniciarEdicao}
                          onConfirmarDelecao={setLembreteParaDeletar}
                        />
                      ))}
                  </div>
                </>
              ) : (
                /* Listagem normal para outras ordenações */
                lembretesFiltrados.map((lembrete) => (
                  <LembreteItem
                    key={lembrete.id}
                    lembrete={lembrete}
                    onToggleConcluido={toggleConcluido}
                    onEditar={iniciarEdicao}
                    onConfirmarDelecao={setLembreteParaDeletar}
                  />
                ))
              )}
            </>
          )}
        </div>

        {/* Rodapé com estatísticas quando houver lembretes */}
        {lembretes.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              {lembretesConcluidos} de {lembretes.length} lembretes concluídos
              {" | "}
              {progressoPercentual}% de progresso
            </p>
          </div>
        )}

        {/* Indicador de loading global */}
        {isLoading && (
          <div className="fixed bottom-4 left-4 bg-white rounded-lg shadow-lg px-4 py-2 flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm text-gray-600">Processando...</span>
          </div>
        )}

        {/* Toast flutuante */}
        <Toast
          message={toast?.message || ""}
          type={toast?.type || "success"}
          isVisible={!!toast}
          onClose={() => setToast(null)}
        />

        {/* Modal de confirmação de deleção */}
        <ConfirmacaoModal
          isOpen={!!lembreteParaDeletar}
          onClose={cancelarDelecao}
          onConfirm={confirmarDelecao}
          titulo="Confirmar Deleção"
          mensagem="Tem certeza que deseja deletar este lembrete? Esta ação não pode ser desfeita."
          confirmarText="Deletar"
          cancelarText="Cancelar"
          type="delete"
        />
      </div>
    </div>
  );
}

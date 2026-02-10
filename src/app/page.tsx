"use client";

import { useState, useEffect } from "react";
import { Lembrete } from "@/types/lembrete";
import LembreteForm from "@/components/LembreteForm";
import LembreteItem from "@/components/LembreteItem";
import FiltrosLembretes from "@/components/FiltrosLembretes";
import Toast from "@/components/Toast";
import ConfirmacaoModal from "@/components/ConfirmacaoModal";

export default function Home() {
  const [lembretes, setLembretes] = useState<Lembrete[]>([]);
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

  useEffect(() => {
    const salvos = localStorage.getItem("lembretes");
    if (salvos) {
      setLembretes(JSON.parse(salvos));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("lembretes", JSON.stringify(lembretes));
  }, [lembretes]);

  const adicionarLembrete = (texto: string) => {
    const novoLembrete: Lembrete = {
      id: crypto.randomUUID(),
      texto,
      concluido: false,
      criadoEm: new Date(),
    };
    setLembretes([novoLembrete, ...lembretes]);
    mostrarToast("Lembrete adicionado com sucesso!");
  };

  const toggleConcluido = (id: string) => {
    setLembretes(
      lembretes.map((lembrete) => {
        if (lembrete.id === id) {
          const novoEstado = !lembrete.concluido;
          return {
            ...lembrete,
            concluido: novoEstado,
            concluidoEm: novoEstado ? new Date() : undefined,
          };
        }
        return lembrete;
      })
    );
  };

  const editarLembrete = (id: string, texto: string) => {
    setLembretes(
      lembretes.map((lembrete) =>
        lembrete.id === id ? { ...lembrete, texto } : lembrete
      )
    );
    setLembreteEditando(null);
    mostrarToast("Lembrete atualizado com sucesso!");
  };

  const deletarLembrete = (id: string) => {
    setLembretes(lembretes.filter((lembrete) => lembrete.id !== id));
  };

  const iniciarEdicao = (lembrete: Lembrete) => {
    setLembreteEditando(lembrete);
  };

  const cancelarEdicao = () => {
    setLembreteEditando(null);
  };

  const mostrarToast = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setToast({ message, type });
  };

  const verificarDuplicata = (texto: string, editandoId?: string): boolean => {
    return lembretes.some(
      (lembrete) =>
        lembrete.texto.toLowerCase().trim() === texto.toLowerCase().trim() &&
        lembrete.id !== editandoId
    );
  };

  const confirmarDelecao = () => {
    if (lembreteParaDeletar) {
      deletarLembrete(lembreteParaDeletar);
      setLembreteParaDeletar(null);
      mostrarToast("Lembrete deletado com sucesso!");
    }
  };

  const cancelarDelecao = () => {
    setLembreteParaDeletar(null);
  };

  const filtrarEOrdenarLembretes = () => {
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
  };

  const lembretesFiltrados = filtrarEOrdenarLembretes();
  const lembretesConcluidos = lembretes.filter((l) => l.concluido).length;

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
              {ordenarPor === "status" && mostrarConcluidos && (
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
              )}

              {/* Listagem normal para outras ordenações */}
              {ordenarPor !== "status" &&
                lembretesFiltrados.map((lembrete) => (
                  <LembreteItem
                    key={lembrete.id}
                    lembrete={lembrete}
                    onToggleConcluido={toggleConcluido}
                    onEditar={iniciarEdicao}
                    onConfirmarDelecao={setLembreteParaDeletar}
                  />
                ))}
            </>
          )}
        </div>

        {/* Rodapé com estatísticas quando houver lembretes */}
        {lembretes.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              {lembretesConcluidos} de {lembretes.length} lembretes concluídos |{" "}
              {Math.round((lembretesConcluidos / lembretes.length) * 100)}% de
              progresso
            </p>
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

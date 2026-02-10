'use client';

import { useEffect, useRef } from 'react';

interface ConfirmacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  titulo: string;
  mensagem: string;
  confirmarText?: string;
  cancelarText?: string;
  type?: 'delete' | 'warning' | 'info';
}

export default function ConfirmacaoModal({
  isOpen,
  onClose,
  onConfirm,
  titulo,
  mensagem,
  confirmarText = "Confirmar",
  cancelarText = "Cancelar",
  type = 'delete'
}: ConfirmacaoModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus no botão de confirmação quando o modal abre
      setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 100);

      // Impedir scroll do body quando o modal está aberto
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node) && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIconAndColors = () => {
    switch (type) {
      case 'delete':
        return {
          icon: (
            <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ),
          buttonColor: 'bg-red-500 hover:bg-red-600 focus:ring-red-500'
        };
      case 'warning':
        return {
          icon: (
            <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ),
          buttonColor: 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500'
        };
      case 'info':
        return {
          icon: (
            <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          ),
          buttonColor: 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500'
        };
      default:
        return {
          icon: null,
          buttonColor: 'bg-gray-500 hover:bg-gray-600 focus:ring-gray-500'
        };
    }
  };

  const { icon, buttonColor } = getIconAndColors();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm fade-in"
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className="relative bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 modal-scale"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <div className="p-6">
          {/* Header com ícone */}
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100">
            {icon}
          </div>
          
          {/* Título e mensagem */}
          <div className="text-center mb-6">
            <h3 
              id="modal-title" 
              className="text-lg font-semibold text-gray-900 mb-2"
            >
              {titulo}
            </h3>
            <p 
              id="modal-description" 
              className="text-gray-600"
            >
              {mensagem}
            </p>
          </div>
          
          {/* Botões */}
          <div className="flex gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              {cancelarText}
            </button>
            <button
              ref={confirmButtonRef}
              type="button"
              onClick={onConfirm}
              className={`flex-1 px-4 py-2 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${buttonColor}`}
            >
              {confirmarText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
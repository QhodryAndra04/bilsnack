import React from 'react';

const Modal = ({ isOpen, onClose, title, message, type = 'info' }) => {
  if (!isOpen) return null;

  const getIcon = (type) => {
    const iconClasses = "w-6 h-6 mr-3 flex-shrink-0 animate-in zoom-in-50 duration-500";
    
    switch (type) {
      case 'success':
        return (
          <svg className={`${iconClasses} text-green-600 dark:text-green-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className={`${iconClasses} text-red-600 dark:text-red-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'warning':
        return (
          <svg className={`${iconClasses} text-[rgb(var(--accent))]`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className={`${iconClasses} text-blue-600 dark:text-blue-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const typeStyles = {
    success: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300',
    error: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300',
    warning: 'bg-[rgb(var(--accent))]/10 text-[rgb(var(--accent))]',
    info: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className={`relative bg-[rgb(var(--modal-bg))] rounded-xl shadow-[var(--shadow-2xl)] p-6 max-w-md w-full mx-4 transform animate-in zoom-in-95 duration-300 border border-[rgb(var(--border))] ${typeStyles[type]}`}>
        <div className="flex items-start mb-4">
          {getIcon(type)}
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold text-[rgb(var(--modal-title))]">{title}</h3>
              <button
                onClick={onClose}
                className="text-[rgb(var(--modal-close))] hover:text-[rgb(var(--modal-close-hover))] text-2xl leading-none transition-colors ml-4 hover:bg-[rgb(var(--surface-alt))] rounded-full w-8 h-8 flex items-center justify-center"
              >
                &times;
              </button>
            </div>
          </div>
        </div>
        <p className="text-[rgb(var(--modal-text))] mb-6 leading-relaxed ml-9">{message}</p>
        <div className="flex justify-end ml-9">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[rgb(var(--modal-btn-bg))] hover:bg-[rgb(var(--modal-btn-hover))] text-white rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-[var(--shadow-md)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]/40"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
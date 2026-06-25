// src/components/admin/Modal.jsx
import { useEffect } from 'react';

export default function Modal({ titulo, onClose, children, maxWidth = 500 }) {
  // Cerrar con Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div style={s.overlay} onClick={onClose}>
      <div
        style={{ ...s.modal, maxWidth }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={s.header}>
          <h3 style={s.titulo}>{titulo}</h3>
          <button style={s.closeBtn} onClick={onClose} title="Cerrar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={s.body}>{children}</div>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(10, 20, 35, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    padding: '16px',
    animation: 'fadeIn 0.18s ease',
  },
  modal: {
    background: '#fff',
    borderRadius: 16,
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 24px 64px rgba(0,0,0,0.28), 0 4px 16px rgba(0,0,0,0.12)',
    fontFamily: "'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif",
    animation: 'slideUp 0.2s cubic-bezier(.4,0,.2,1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px 18px',
    borderBottom: '1px solid #F1F5F9',
    position: 'sticky',
    top: 0,
    background: '#fff',
    zIndex: 1,
    borderRadius: '16px 16px 0 0',
  },
  titulo: {
    margin: 0,
    fontSize: 17,
    fontWeight: 800,
    color: '#0F1E2E',
    letterSpacing: -0.3,
  },
  closeBtn: {
    background: '#F1F5F9',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    color: '#64748B',
    padding: '7px 8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s, color 0.15s',
    flexShrink: 0,
  },
  body: {
    padding: '20px 24px 24px',
  },
};
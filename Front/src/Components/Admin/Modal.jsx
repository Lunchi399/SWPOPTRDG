export default function Modal({ titulo, onClose, children }) {
  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={s.header}>
          <h3 style={s.titulo}>{titulo}</h3>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={s.body}>{children}</div>
      </div>
    </div>
  );
}

const s = {
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)',
             display:'flex', alignItems:'center', justifyContent:'center',
             zIndex:200 },
  modal:   { background:'#fff', borderRadius:12, width:'100%',
             maxWidth:480, maxHeight:'90vh', overflowY:'auto',
             boxShadow:'0 20px 60px rgba(0,0,0,0.3)' },
  header:  { display:'flex', justifyContent:'space-between', alignItems:'center',
             padding:'1rem 1.25rem', borderBottom:'1px solid #eee' },
  titulo:  { margin:0, fontSize:15, fontWeight:700, color:'#1E2D40' },
  closeBtn:{ background:'none', border:'none', fontSize:16,
             cursor:'pointer', color:'#888', padding:'4px 8px' },
  body:    { padding:'1.25rem' },
};
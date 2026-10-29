import { useEffect, useRef } from 'react';

export default function Modal({ title, onClose, children,wide=false }) {
  const ref = useRef(null);
  useEffect(() => { ref.current.showModal(); }, []);
  return <dialog ref={ref} className={`info-dialog ${wide?'settings-dialog':''}`} aria-labelledby="modal-title" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="info-top"><span className="eyebrow">NEIROSLOP BURMALDA</span><button className="icon-button" aria-label="Close dialog" onClick={onClose}>✕</button></div>
    <h2 id="modal-title">{title}</h2>{children}
  </dialog>;
}

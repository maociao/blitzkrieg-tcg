import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ children, onClose }) => (
  <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="bg-gray-900 border border-gray-600 rounded-xl p-6 max-w-md w-full relative shadow-2xl shadow-black/50 animate-in zoom-in-95 duration-200">
      <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-white"><X /></button>
      {children}
    </div>
  </div>
);

export default Modal;

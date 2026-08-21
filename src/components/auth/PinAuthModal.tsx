import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { X, Lock, KeyRound, User, ShieldCheck, Check } from 'lucide-react';

interface PinAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PinAuthModal: React.FC<PinAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { users, currentUser, switchUser } = usePOS();

  const [enteredPin, setEnteredPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDigitClick = (digit: string) => {
    if (enteredPin.length < 6) {
      const newPin = enteredPin + digit;
      setEnteredPin(newPin);
      setErrorMessage(null);
    }
  };

  const handleDelete = () => {
    setEnteredPin(enteredPin.slice(0, -1));
    setErrorMessage(null);
  };

  const handleClear = () => {
    setEnteredPin('');
    setErrorMessage(null);
  };

  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!enteredPin) return;

    const res = switchUser(enteredPin);
    if (res.success) {
      setEnteredPin('');
      setErrorMessage(null);
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setErrorMessage(res.message);
      setEnteredPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Ganti Pengguna / Masuk PIN</h3>
              <p className="text-[11px] text-slate-400">Masukkan PIN akun Anda</p>
            </div>
          </div>
          <button
            onClick={() => {
              setEnteredPin('');
              setErrorMessage(null);
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-center">
          {/* User Quick Info */}
          <div className="space-y-1">
            <span className="text-xs text-slate-400">Pengguna Aktif Saat Ini:</span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold">
              <span>{currentUser.avatar || '👤'}</span>
              <span>{currentUser.name}</span>
              <span className="text-slate-400 font-normal">({currentUser.role})</span>
            </div>
          </div>

          {/* PIN Input Display */}
          <div className="flex justify-center gap-3 py-2">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`w-11 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-all ${
                  enteredPin.length > index
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-400'
                }`}
              >
                {enteredPin.length > index ? '•' : ''}
              </div>
            ))}
          </div>

          {errorMessage && (
            <p className="text-xs font-semibold text-rose-600 animate-shake">
              {errorMessage}
            </p>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2 pt-1 max-w-[240px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigitClick(digit)}
                className="w-16 h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-black text-xl flex items-center justify-center transition-colors shadow-2xs"
              >
                {digit}
              </button>
            ))}

            <button
              type="button"
              onClick={handleClear}
              className="w-16 h-14 rounded-2xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 font-bold text-xs flex items-center justify-center transition-colors"
            >
              Hapus
            </button>

            <button
              type="button"
              onClick={() => handleDigitClick('0')}
              className="w-16 h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-black text-xl flex items-center justify-center transition-colors shadow-2xs"
            >
              0
            </button>

            <button
              type="button"
              onClick={() => handleVerify()}
              className="w-16 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-sm flex items-center justify-center transition-colors shadow-sm"
            >
              <Check className="w-6 h-6" />
            </button>
          </div>

          {/* Quick sample credentials helper for demo */}
          <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-100 space-y-1">
            <span className="font-bold text-slate-500 block">PIN Akun Demo:</span>
            <div className="flex justify-center gap-3 text-slate-600">
              <span>Admin: <strong className="font-mono text-emerald-700">1234</strong></span>
              <span>Kasir 1: <strong className="font-mono text-slate-700">0000</strong></span>
              <span>Kasir 2: <strong className="font-mono text-slate-700">1111</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

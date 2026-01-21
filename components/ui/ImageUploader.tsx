
import React, { useState, useRef } from 'react';
import Button from './Button';
import UploadIcon from '../icons/UploadIcon';
import Spinner from './Spinner';
import SaveIcon from '../icons/SaveIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import AlertTriangleIcon from '../icons/AlertTriangleIcon';
import { compressImage } from '../../services/utils';

interface ImageUploaderProps {
  onUpload: (base64: string) => void;
  status?: 'saving' | 'saved' | 'error';
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onUpload, status }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
          // Compress immediately and trigger upload
          const compressed = await compressImage(file, 400, 0.8);
          onUpload(compressed);
      } catch (err) {
          console.error("Compression failed", err);
          alert("Failed to process image.");
      }
      // Reset input so the same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const statusIcon = {
    saved: <div className="flex items-center gap-1 text-green-600 font-bold text-[10px] animate-in fade-in"><CheckCircleIcon className="w-4 h-4" /> UPDATED</div>,
    error: <div className="flex items-center gap-1 text-red-600 font-bold text-[10px]"><AlertTriangleIcon className="w-4 h-4" /> FAILED</div>,
    saving: <div className="flex items-center gap-2 text-blue-600 font-bold text-[10px]"><Spinner className="w-4 h-4 border-2" /> UPLOADING...</div>,
  };

  return (
    <div className="flex items-center gap-2">
        {status && <div className="px-2">{statusIcon[status]}</div>}
        
        {!status || status === 'saved' || status === 'error' ? (
            <Button 
                onClick={() => fileInputRef.current?.click()} 
                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-[10px] h-9 px-4 font-black uppercase tracking-wider flex items-center gap-2 rounded-xl shadow-sm transition-all active:scale-95"
            >
                <UploadIcon className="w-3.5 h-3.5" /> Upload Crest
            </Button>
        ) : null}

        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/png, image/jpeg, image/svg+xml, image/webp" 
            className="hidden"
        />
    </div>
  );
};

export default ImageUploader;

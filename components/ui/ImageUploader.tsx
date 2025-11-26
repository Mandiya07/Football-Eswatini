import React, { useState, useRef } from 'react';
import Button from './Button';
import UploadIcon from '../icons/UploadIcon';
import Spinner from './Spinner';
import SaveIcon from '../icons/SaveIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import AlertTriangleIcon from '../icons/AlertTriangleIcon';

interface ImageUploaderProps {
  onUpload: (base64: string) => void;
  status?: 'saving' | 'saved' | 'error';
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onUpload, status }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    if (preview) {
      onUpload(preview);
      // setPreview(null); // Optional: clear preview after saving
    }
  };

  const handleCancel = () => {
    setPreview(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }

  if (preview) {
    return (
        <div className="flex items-center gap-2">
            <img src={preview} alt="Preview" className="w-10 h-10 rounded-full object-contain border bg-gray-50"/>
            <Button onClick={handleUploadClick} className="bg-blue-600 text-white text-xs h-9 px-3" disabled={status === 'saving'}>
                {status === 'saving' ? <Spinner className="w-4 h-4 border-2"/> : <SaveIcon className="w-4 h-4"/>}
            </Button>
             <Button onClick={handleCancel} className="bg-gray-200 text-gray-700 text-xs h-9 px-3">
                Cancel
            </Button>
        </div>
    );
  }
  
  const statusIcon = {
    saved: <CheckCircleIcon className="w-4 h-4 text-green-500" />,
    error: <AlertTriangleIcon className="w-4 h-4 text-red-500" />,
    saving: <Spinner className="w-4 h-4 border-2" />,
  };

  return (
    <div className="flex items-center gap-2">
        {status && <div className="p-2">{statusIcon[status]}</div>}
        <Button 
            onClick={() => fileInputRef.current?.click()} 
            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs h-9 px-3 flex items-center gap-1.5"
        >
            <UploadIcon className="w-4 h-4" /> Change Crest
        </Button>
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
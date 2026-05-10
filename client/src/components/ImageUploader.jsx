import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadImage } from '../api/client';

function UploadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-[#717171]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

const MAX_IMAGES = 8;

export default function ImageUploader({ value = [], onChange }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [progress, setProgress] = useState([]);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!acceptedFiles.length) return;
    const remaining = MAX_IMAGES - value.length;
    const filesToUpload = acceptedFiles.slice(0, remaining);
    if (!filesToUpload.length) return;

    setUploading(true);
    setUploadError('');
    setProgress(filesToUpload.map(() => 0));

    const results = [];
    for (let i = 0; i < filesToUpload.length; i++) {
      try {
        const res = await uploadImage(filesToUpload[i]);
        results.push(res.data.url);
        setProgress((prev) => prev.map((p, idx) => (idx === i ? 100 : p)));
      } catch (err) {
        const msg = err.response?.status === 400
          ? 'Image upload failed. Cloud storage may not be configured.'
          : 'Failed to upload image. Please try again.';
        setUploadError(msg);
      }
    }

    if (results.length) {
      onChange([...value, ...results]);
    }
    setUploading(false);
    setProgress([]);
  }, [value, onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    disabled: uploading || value.length >= MAX_IMAGES,
    maxFiles: MAX_IMAGES - value.length,
  });

  function removeImage(idx) {
    const next = value.filter((_, i) => i !== idx);
    onChange(next);
  }

  return (
    <div className="space-y-4">
      {value.length < MAX_IMAGES && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-brand bg-red-50'
              : 'border-[#DDDDDD] hover:border-[#717171] bg-[#F7F7F7]'
          } ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3">
            <UploadIcon />
            {isDragActive ? (
              <p className="text-sm font-medium text-brand">Drop images here</p>
            ) : (
              <>
                <p className="text-sm font-medium text-[#222222]">
                  Drag and drop photos here, or click to select
                </p>
                <p className="text-xs text-[#717171]">
                  {MAX_IMAGES - value.length} of {MAX_IMAGES} slots remaining. Images only.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {uploading && progress.length > 0 && (
        <div className="space-y-1">
          {progress.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-[#DDDDDD] rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand rounded-full transition-all duration-300"
                  style={{ width: `${p}%` }}
                />
              </div>
              <span className="text-xs text-[#717171] w-10">{p}%</span>
            </div>
          ))}
        </div>
      )}

      {uploadError && (
        <div className="bg-red-50 border border-[#C13515]/20 text-[#C13515] rounded-lg px-4 py-3 text-sm">
          {uploadError}
        </div>
      )}

      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {value.map((url, idx) => (
            <div key={url + idx} className="relative group rounded-xl overflow-hidden aspect-square bg-[#F7F7F7]">
              <img
                src={url}
                alt={`Upload ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1.5 right-1.5 bg-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#F7F7F7]"
                aria-label="Remove image"
              >
                <XIcon />
              </button>
              {idx === 0 && (
                <span className="absolute bottom-1.5 left-1.5 bg-[#222222]/70 text-white text-xs px-2 py-0.5 rounded-md">
                  Cover
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

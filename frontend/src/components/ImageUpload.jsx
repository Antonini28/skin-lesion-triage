import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

export default function ImageUpload({ onUpload, loading }) {
    const [preview, setPreview] = useState(null);

    const onDrop = useCallback(
        (acceptedFiles) => {
            const file = acceptedFiles[0];
            if (!file) return;

            setPreview(URL.createObjectURL(file));
            onUpload(file);
        },
        [onUpload]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
        maxFiles: 1,
        maxSize: 10 * 1024 * 1024, // 10 MB
        disabled: loading,
    });

    return (
        <div className="upload-area">
            <div
                {...getRootProps()}
                className={`dropzone ${isDragActive ? 'dropzone--active' : ''} ${loading ? 'dropzone--disabled' : ''}`}
                id="image-dropzone"
            >
                <input {...getInputProps()} id="file-input" />

                {loading ? (
                    <div className="dropzone-loading">
                        <div className="spinner" />
                        <p className="dropzone-loading-text">Analysing image…</p>
                        <p className="dropzone-loading-sub">
                            This may take up to 60 seconds if the server is waking up.
                        </p>
                    </div>
                ) : preview ? (
                    <div className="dropzone-preview">
                        <img src={preview} alt="Uploaded lesion" className="preview-img" />
                        <p className="dropzone-hint">Click or drop to replace</p>
                    </div>
                ) : (
                    <div className="dropzone-empty">
                        <div className="dropzone-icon">📸</div>
                        <p className="dropzone-title">
                            {isDragActive ? 'Drop the image here' : 'Drag & drop a skin lesion image'}
                        </p>
                        <p className="dropzone-sub">or click to browse — JPG / PNG, max 10 MB</p>
                    </div>
                )}
            </div>
        </div>
    );
}

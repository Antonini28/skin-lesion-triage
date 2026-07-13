import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ScanFrame, Camera } from './Icons';

export default function ImageUpload({ onUpload, loading }) {
    const [preview,    setPreview]    = useState(null);
    const [camOpen,    setCamOpen]    = useState(false);
    const [camError,   setCamError]   = useState('');
    const [capturing,  setCapturing]  = useState(false);

    const videoRef  = useRef(null);
    const streamRef = useRef(null);

    // Stop camera stream when component unmounts or cam closes
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        setCamOpen(false);
        setCamError('');
    };

    useEffect(() => () => stopCamera(), []);

    const openCamera = async () => {
        setCamError('');
        setCapturing(false);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false,
            });
            streamRef.current = stream;
            setCamOpen(true);
            // attach stream after state update renders the video element
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
            }, 100);
        } catch {
            setCamError('Camera access denied or not available. Please allow camera permission.');
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current) return;
        setCapturing(true);
        const video  = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width  = video.videoWidth  || 640;
        canvas.height = video.videoHeight || 480;
        canvas.getContext('2d').drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
            const file = new File([blob], 'webcam_capture.jpg', { type: 'image/jpeg' });
            setPreview(URL.createObjectURL(blob));
            stopCamera();
            onUpload(file);
        }, 'image/jpeg', 0.92);
    };

    // File drop
    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (!file) return;
        setPreview(URL.createObjectURL(file));
        onUpload(file);
    }, [onUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
        maxFiles: 1,
        maxSize: 10 * 1024 * 1024,
        disabled: loading || camOpen,
    });

    // ── Webcam view ──────────────────────────────────────────────────────────
    if (camOpen) {
        return (
            <div className="upload-area">
                <div className="webcam-container">
                    <video ref={videoRef} className="webcam-video" autoPlay playsInline muted />
                    <div className="webcam-controls">
                        <button className="btn-capture" onClick={capturePhoto} disabled={capturing}>
                            {capturing ? 'Capturing…' : <><Camera size={17} /> Capture</>}
                        </button>
                        <button className="btn-cam-cancel" onClick={stopCamera}>
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Normal upload view ───────────────────────────────────────────────────
    return (
        <div className="upload-area">
            <div
                {...getRootProps()}
                className={`dropzone ${isDragActive ? 'dropzone--active' : ''} ${loading ? 'dropzone--disabled' : ''}`}
            >
                <input {...getInputProps()} />

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
                        <div className="dropzone-icon"><ScanFrame size={40} /></div>
                        <p className="dropzone-title">
                            {isDragActive ? 'Drop the image here' : 'Drag & drop a skin lesion image'}
                        </p>
                        <p className="dropzone-sub">or click to browse — JPG / PNG, max 10 MB</p>
                    </div>
                )}
            </div>

            {!loading && (
                <div className="cam-row">
                    <button className="btn-use-camera" onClick={openCamera} type="button">
                        <Camera size={17} /> Use Camera
                    </button>
                    {camError && <p className="cam-error">{camError}</p>}
                </div>
            )}
        </div>
    );
}

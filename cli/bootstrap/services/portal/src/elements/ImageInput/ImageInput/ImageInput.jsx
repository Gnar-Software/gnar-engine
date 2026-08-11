import React, { useState, useEffect } from 'react';
import { fileToBase64 } from '../../utils/utils.js';

function ImageInput({ key, label, value: uploadedImages, onChange: setUploadedImages, maxFileSizeMb = 5 }) {

    const [selectedFiles, setSelectedFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);

    const handleFileSelection = (files) => {
        const validFiles = Array.from(files).filter(
            (file) =>
                [
                    'image/jpeg',
                    'image/png',
                    'image/jpg',
                    'image/gif',
                    'image/svg+xml'
                ].includes(file.type) &&
                file.size <= maxFileSizeMb * 1024 * 1024 
        );

        const filePreviews = validFiles.map((file) => URL.createObjectURL(file));

        setSelectedFiles(validFiles);
        setImagePreviews(filePreviews);
        
        (async () => {
            const file = validFiles[0];
            const mimeType = file.type;
            const fileName = file.name;
            const base64File = await fileToBase64(file);
            setUploadedImages(base64File, mimeType, fileName);
        })();
    }

    const handleFileChange = (event) => {
        const files = event.target.files;
        if (files) {
            handleFileSelection(files);
        }
    }

    const handleDrop = (event) => {
        event.preventDefault();
        const files = event.dataTransfer.files;
        if (files) {
            handleFileSelection(files);
        }
    }

    const handleRemoveFile = (index) => {
        setSelectedFiles((prev) => {
            const updatedFiles = prev.filter((_, i) => i !== index);
            setUploadedImages(updatedFiles);
            return updatedFiles;
        });
        setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    }

    useEffect(() => {
        if (uploadedImages?.url) {
            setImagePreviews([uploadedImages.url]);
        }
    }, [uploadedImages])

    useEffect(() => {
        return () => {
            imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
        };
    }, [imagePreviews])

    return (
        <div className="image-input">
            {label && <label>{label}</label>}
            <div className="image-input-actions">
                <div
                    className="upload-area"
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    style={{
                        border: '2px dashed #ccc',
                        padding: '20px',
                        textAlign: 'center',
                        marginBottom: '20px',
                    }}
                >
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        id="file-input"
                    />
                    <label htmlFor="file-input" style={{ cursor: 'pointer' }}>
                        <p className="upload-text">Click or drag and drop here to upload</p>
                        <p className="upload-text">(JPEG, PNG, JPG, GIF, SVG)</p>
                        <p className="upload-text">Maximum file size: {maxFileSizeMb} MB.</p>
                    </label>
                </div>

                <div className="preview-area">
                    {imagePreviews.map((preview, index) => (
                        <div key={index} style={{ position: 'relative' }} className="image-preview">
                            <img src={preview} alt="preview" />
                            <span onClick={() => handleRemoveFile(index)} className="icon-delete"></span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default ImageInput;

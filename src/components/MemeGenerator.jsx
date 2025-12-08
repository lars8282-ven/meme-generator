import { useState, useRef, useEffect, useCallback } from 'react';
import { db, tx } from '../utils/db';
import { useAuth } from '../context/AuthContext';

const templateImages = [
  '/assets/image.png',
  '/assets/Laughing-Leo-meme-4acd7j.jpg'
];

export default function MemeGenerator({ onPostSuccess }) {
  const { user } = useAuth();
  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [textBoxes, setTextBoxes] = useState([]);
  const [selectedTextBoxId, setSelectedTextBoxId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [nextId, setNextId] = useState(1);
  const [posting, setPosting] = useState(false);

  const selectedTextBox = textBoxes.find(tb => tb.id === selectedTextBoxId);

  // Wrap text into multiple lines
  const wrapText = useCallback((ctx, text, maxWidth) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine + ' ' + word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);
    return lines;
  }, []);

  // Setup canvas dimensions
  const setupCanvas = useCallback((img) => {
    const canvas = canvasRef.current;
    if (!canvas || !canvasContainerRef.current) return;

    const maxWidth = canvasContainerRef.current.clientWidth - 40;
    const maxHeight = window.innerHeight * 0.8;

    let width = img.width;
    let height = img.height;

    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }
    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    canvas.width = img.width;
    canvas.height = img.height;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
  }, []);

  // Redraw canvas with image and all text
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentImage) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);

    // Draw all text boxes
    textBoxes.forEach(textBox => {
      drawText(ctx, textBox, textBox.id === selectedTextBoxId);
    });
  }, [currentImage, textBoxes, selectedTextBoxId, wrapText]);

  // Draw text with white fill and black stroke
  const drawText = useCallback((ctx, textBox, isSelected = false) => {
    ctx.save();

    ctx.font = `bold ${textBox.fontSize}px Impact, Arial Black, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const maxWidth = textBox.maxWidth || canvasRef.current.width * 0.9;
    const lines = wrapText(ctx, textBox.text, maxWidth);
    const lineHeight = textBox.fontSize * 1.2;
    const totalHeight = lines.length * lineHeight;
    const startY = textBox.y - (totalHeight / 2) + (lineHeight / 2);

    let maxLineWidth = 0;
    lines.forEach(line => {
      const metrics = ctx.measureText(line);
      if (metrics.width > maxLineWidth) {
        maxLineWidth = metrics.width;
      }
    });

    // Improved text rendering for better quality
    ctx.textRenderingOptimization = 'optimizeQuality';
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Draw text with better stroke quality
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(6, textBox.fontSize / 6); // Thicker stroke for better visibility
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.miterLimit = 3;
    ctx.fillStyle = textBox.color || '#FFFFFF';

    // Draw stroke multiple times for better definition
    lines.forEach((line, index) => {
      const y = startY + (index * lineHeight);
      // Draw stroke twice for better definition
      ctx.strokeText(line, textBox.x, y);
      ctx.strokeText(line, textBox.x, y);
      // Then draw fill
      ctx.fillText(line, textBox.x, y);
    });

    if (isSelected) {
      const padding = 10;
      ctx.strokeStyle = '#667eea';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        textBox.x - maxLineWidth / 2 - padding,
        textBox.y - totalHeight / 2 - padding,
        maxLineWidth + padding * 2,
        totalHeight + padding * 2
      );
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, [wrapText]);

  // Redraw when dependencies change
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Load template image
  const loadTemplate = useCallback((imagePath) => {
    const img = new Image();
    img.onerror = () => {
      alert('Error loading the template image. Please try again.');
    };
    img.onload = () => {
      setCurrentImage(img);
      setupCanvas(img);
      setTextBoxes([]);
      setSelectedTextBoxId(null);
    };
    img.src = imagePath;
  }, [setupCanvas]);

  // Handle image upload
  const handleImageUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      alert('Error reading the file. Please try again.');
    };

    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => {
        alert('Error loading the image. Please try a different file.');
      };
      img.onload = () => {
        setCurrentImage(img);
        setupCanvas(img);
        setTextBoxes([]);
        setSelectedTextBoxId(null);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }, [setupCanvas]);

  // Add new text box
  const addTextBox = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentImage) {
      alert('Please upload an image first!');
      return;
    }

    const textBox = {
      id: nextId,
      text: 'Your text here',
      x: canvas.width / 2,
      y: canvas.height / 2,
      fontSize: 40,
      color: '#FFFFFF',
      maxWidth: canvas.width * 0.9
    };

    setTextBoxes(prev => [...prev, textBox]);
    setSelectedTextBoxId(textBox.id);
    setNextId(prev => prev + 1);
  }, [currentImage, nextId]);

  // Update text box
  const updateTextBox = useCallback((id, updates) => {
    setTextBoxes(prev => prev.map(tb => 
      tb.id === id ? { ...tb, ...updates } : tb
    ));
  }, []);

  // Remove text box
  const removeTextBox = useCallback((id) => {
    setTextBoxes(prev => {
      const filtered = prev.filter(tb => tb.id !== id);
      if (selectedTextBoxId === id) {
        setSelectedTextBoxId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  }, [selectedTextBoxId]);

  // Mouse events for dragging
  const handleMouseDown = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas || !currentImage) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Check if clicking on a text box
    const ctx = canvas.getContext('2d');
    for (let i = textBoxes.length - 1; i >= 0; i--) {
      const textBox = textBoxes[i];
      ctx.font = `bold ${textBox.fontSize}px Impact, Arial Black, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const maxWidth = textBox.maxWidth || canvas.width * 0.9;
      const lines = wrapText(ctx, textBox.text, maxWidth);
      const lineHeight = textBox.fontSize * 1.2;
      const totalHeight = lines.length * lineHeight;

      let maxLineWidth = 0;
      lines.forEach(line => {
        const metrics = ctx.measureText(line);
        if (metrics.width > maxLineWidth) {
          maxLineWidth = metrics.width;
        }
      });

      const padding = 10;

      if (x >= textBox.x - maxLineWidth / 2 - padding &&
          x <= textBox.x + maxLineWidth / 2 + padding &&
          y >= textBox.y - totalHeight / 2 - padding &&
          y <= textBox.y + totalHeight / 2 + padding) {
        
        setSelectedTextBoxId(textBox.id);
        setIsDragging(true);
        setDragOffset({ x: x - textBox.x, y: y - textBox.y });
        return;
      }
    }

    setSelectedTextBoxId(null);
  }, [currentImage, textBoxes, wrapText]);

  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!isDragging || !selectedTextBox || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const newX = Math.max(0, Math.min(canvas.width, x - dragOffset.x));
    const newY = Math.max(0, Math.min(canvas.height, y - dragOffset.y));

    updateTextBox(selectedTextBox.id, { x: newX, y: newY });
  }, [isDragging, selectedTextBox, dragOffset, updateTextBox]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Download meme
  const downloadMeme = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentImage) {
      alert('Please upload an image first!');
      return;
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = currentImage.width;
    tempCanvas.height = currentImage.height;
    const tempCtx = tempCanvas.getContext('2d');

    tempCtx.drawImage(currentImage, 0, 0);

    const scaleX = tempCanvas.width / canvas.width;
    const scaleY = tempCanvas.height / canvas.height;

    textBoxes.forEach(textBox => {
      tempCtx.save();

      const scaledFontSize = textBox.fontSize * scaleX;
      tempCtx.font = `bold ${scaledFontSize}px Impact, Arial Black, sans-serif`;
      tempCtx.textAlign = 'center';
      tempCtx.textBaseline = 'middle';

      const scaledX = textBox.x * scaleX;
      const scaledY = textBox.y * scaleY;
      const scaledMaxWidth = (textBox.maxWidth || canvas.width * 0.9) * scaleX;

      const lines = wrapText(tempCtx, textBox.text, scaledMaxWidth);
      const lineHeight = scaledFontSize * 1.2;
      const totalHeight = lines.length * lineHeight;
      const startY = scaledY - (totalHeight / 2) + (lineHeight / 2);

      // Improved text rendering for better quality
      tempCtx.textRenderingOptimization = 'optimizeQuality';
      tempCtx.imageSmoothingEnabled = true;
      tempCtx.imageSmoothingQuality = 'high';
      
      tempCtx.strokeStyle = '#000000';
      tempCtx.lineWidth = Math.max(6, scaledFontSize / 6); // Thicker stroke
      tempCtx.lineJoin = 'round';
      tempCtx.lineCap = 'round';
      tempCtx.miterLimit = 3;
      tempCtx.fillStyle = textBox.color || '#FFFFFF';

      // Draw stroke multiple times for better definition
      lines.forEach((line, index) => {
        const y = startY + (index * lineHeight);
        // Draw stroke twice for better definition
        tempCtx.strokeText(line, scaledX, y);
        tempCtx.strokeText(line, scaledX, y);
        // Then draw fill
        tempCtx.fillText(line, scaledX, y);
      });

      tempCtx.restore();
    });

    tempCanvas.toBlob(function(blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'meme.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }, [currentImage, textBoxes, wrapText]);

  // Compress and resize image if needed
  const compressImage = useCallback((canvas, maxWidth = 1920, maxHeight = 1920, quality = 0.85) => {
    return new Promise((resolve) => {
      let width = canvas.width;
      let height = canvas.height;

      // Calculate new dimensions if image is too large
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = width * ratio;
        height = height * ratio;
      }

      // Create a new canvas with compressed dimensions
      const compressedCanvas = document.createElement('canvas');
      compressedCanvas.width = width;
      compressedCanvas.height = height;
      const compressedCtx = compressedCanvas.getContext('2d');

      // Enable high-quality rendering
      compressedCtx.imageSmoothingEnabled = true;
      compressedCtx.imageSmoothingQuality = 'high';

      // Draw the original canvas onto the compressed canvas
      compressedCtx.drawImage(canvas, 0, 0, width, height);

      // Try different quality levels to get under size limit
      const tryCompress = (q) => {
        compressedCanvas.toBlob(
          (blob) => {
            if (blob && blob.size > 1000000) { // Still over 1MB
              if (q > 0.5) {
                // Try lower quality
                tryCompress(q - 0.1);
              } else {
                // If still too large, resize more aggressively
                const newMaxWidth = Math.floor(maxWidth * 0.8);
                const newMaxHeight = Math.floor(maxHeight * 0.8);
                if (newMaxWidth > 800 && newMaxHeight > 800) {
                  // Recursively compress with smaller dimensions
                  compressImage(canvas, newMaxWidth, newMaxHeight, 0.7).then(resolve);
                } else {
                  // Last resort - use current blob
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result);
                  reader.readAsDataURL(blob);
                }
              }
            } else {
              // Size is acceptable
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(blob);
            }
          },
          'image/jpeg',
          q
        );
      };

      tryCompress(quality);
    });
  }, []);

  // Post meme to database
  const postMeme = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !currentImage || !user) {
      alert('Please sign in and upload an image first!');
      return;
    }

    setPosting(true);

    try {
      // Convert canvas to base64 image
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = currentImage.width;
      tempCanvas.height = currentImage.height;
      const tempCtx = tempCanvas.getContext('2d');

      // Enable high-quality rendering
      tempCtx.imageSmoothingEnabled = true;
      tempCtx.imageSmoothingQuality = 'high';

      tempCtx.drawImage(currentImage, 0, 0);

      const scaleX = tempCanvas.width / canvas.width;
      const scaleY = tempCanvas.height / canvas.height;

      textBoxes.forEach(textBox => {
        tempCtx.save();

        const scaledFontSize = textBox.fontSize * scaleX;
        tempCtx.font = `bold ${scaledFontSize}px Impact, Arial Black, sans-serif`;
        tempCtx.textAlign = 'center';
        tempCtx.textBaseline = 'middle';

        const scaledX = textBox.x * scaleX;
        const scaledY = textBox.y * scaleY;
        const scaledMaxWidth = (textBox.maxWidth || canvas.width * 0.9) * scaleX;

        const lines = wrapText(tempCtx, textBox.text, scaledMaxWidth);
        const lineHeight = scaledFontSize * 1.2;
        const totalHeight = lines.length * lineHeight;
        const startY = scaledY - (totalHeight / 2) + (lineHeight / 2);

        // Improved text rendering for better quality
        tempCtx.textRenderingOptimization = 'optimizeQuality';
        tempCtx.imageSmoothingEnabled = true;
        tempCtx.imageSmoothingQuality = 'high';
        
        tempCtx.strokeStyle = '#000000';
        tempCtx.lineWidth = Math.max(6, scaledFontSize / 6); // Thicker stroke
        tempCtx.lineJoin = 'round';
        tempCtx.lineCap = 'round';
        tempCtx.miterLimit = 3;
        tempCtx.fillStyle = textBox.color || '#FFFFFF';

        // Draw stroke multiple times for better definition
        lines.forEach((line, index) => {
          const y = startY + (index * lineHeight);
          // Draw stroke twice for better definition
          tempCtx.strokeText(line, scaledX, y);
          tempCtx.strokeText(line, scaledX, y);
          // Then draw fill
          tempCtx.fillText(line, scaledX, y);
        });

        tempCtx.restore();
      });

      // Compress image automatically if needed
      console.log('Compressing image if needed...');
      const imageUrl = await compressImage(tempCanvas);
      console.log('Compressed image size:', (imageUrl.length / 1024).toFixed(2), 'KB');

      // Save to InstantDB
      // Generate a unique ID using crypto
      const id = crypto.randomUUID();
      
      console.log('Posting meme with ID:', id);
      console.log('User ID:', user.id);
      console.log('Image URL length:', imageUrl.length);

      // InstantDB React transaction API
      // Use tx imported from @instantdb/react
      await db.transact(
        tx.memes[id].update({
          imageUrl,
          createdAt: Date.now(),
          userId: user.id,
        })
      );

      console.log('Meme posted successfully');

      if (onPostSuccess) {
        onPostSuccess();
      }

      alert('Meme posted successfully!');
    } catch (error) {
      console.error('Error posting meme:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      alert(`Error posting meme: ${error.message || 'Please try again.'}`);
    } finally {
      setPosting(false);
    }
  }, [currentImage, textBoxes, user, wrapText, onPostSuccess, compressImage]);

  return (
    <div className="app-wrapper">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">Meme Generator</h1>
          <p className="app-subtitle">Create hilarious memes in seconds</p>
        </div>
      </header>

      <main className="app-main">
        <div className="workspace">
          <aside className="sidebar">
            <div className="sidebar-section">
              <div className="section-header">
                <h2 className="section-title">Templates</h2>
              </div>
              <div className="section-content">
                <div className="templates-gallery">
                  {templateImages.map((templatePath, index) => (
                    <div
                      key={index}
                      className="template-item"
                      onClick={() => loadTemplate(templatePath)}
                    >
                      <img
                        src={templatePath}
                        alt="Template"
                        className="template-thumbnail"
                        onError={(e) => {
                          console.warn(`Failed to load template: ${templatePath}`);
                          e.target.parentElement.remove();
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="sidebar-section">
              <div className="section-header">
                <h2 className="section-title">Upload Image</h2>
              </div>
              <div className="section-content">
                <input
                  type="file"
                  id="imageInput"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  className="file-input"
                  onChange={handleImageUpload}
                />
                <label htmlFor="imageInput" className="file-upload-btn">
                  <span className="upload-text">Choose Image</span>
                </label>
              </div>
            </div>

            <div className="sidebar-section">
              <div className="section-header">
                <h2 className="section-title">Text Overlays</h2>
                <button className="icon-btn" onClick={addTextBox} title="Add Text Box">
                  <span>+</span>
                </button>
              </div>
              <div className="section-content">
                <div className="text-boxes-list">
                  {textBoxes.map(textBox => (
                    <div
                      key={textBox.id}
                      className={`text-box-item ${selectedTextBoxId === textBox.id ? 'selected' : ''}`}
                      onClick={(e) => {
                        if (!e.target.classList.contains('delete-btn') &&
                            !e.target.classList.contains('text-input') &&
                            !e.target.classList.contains('color-picker') &&
                            !e.target.classList.contains('size-slider')) {
                          setSelectedTextBoxId(textBox.id);
                        }
                      }}
                    >
                      <div className="text-box-item-header">
                        <label>Text Box {textBox.id}</label>
                        <button
                          className="delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTextBox(textBox.id);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                      <input
                        type="text"
                        className="text-input"
                        value={textBox.text}
                        placeholder="Enter text"
                        autoComplete="off"
                        onChange={(e) => updateTextBox(textBox.id, { text: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="color-control">
                        <label>Color:</label>
                        <input
                          type="color"
                          className="color-picker"
                          value={textBox.color || '#FFFFFF'}
                          onChange={(e) => updateTextBox(textBox.id, { color: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="size-control">
                        <label>Size:</label>
                        <input
                          type="range"
                          className="size-slider"
                          min="10"
                          max="300"
                          value={textBox.fontSize}
                          onChange={(e) => updateTextBox(textBox.id, { fontSize: parseInt(e.target.value) })}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="size-value">{textBox.fontSize}px</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="btn-add-text" onClick={addTextBox}>
                  <span>+</span>
                  Add Text Box
                </button>
              </div>
            </div>

            <div className="sidebar-section sidebar-actions">
              {user && (
                <button
                  className="btn-post"
                  onClick={postMeme}
                  disabled={posting || !currentImage}
                >
                  {posting ? 'Posting...' : 'Post Meme'}
                </button>
              )}
              <button
                className="btn-download"
                onClick={downloadMeme}
                disabled={!currentImage}
              >
                <span>Download Meme</span>
              </button>
            </div>
          </aside>

          <div className="canvas-area">
            <div className="canvas-wrapper" ref={canvasContainerRef}>
              <canvas
                ref={canvasRef}
                id="memeCanvas"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ display: currentImage ? 'block' : 'none' }}
              />
              {!currentImage && (
                <div className="canvas-placeholder">
                  <div className="placeholder-content">
                    <h3 className="placeholder-title">Ready to create?</h3>
                    <p className="placeholder-text">Upload an image to get started</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


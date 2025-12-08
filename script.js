// Canvas and context
const canvas = document.getElementById('memeCanvas');
const ctx = canvas.getContext('2d');
const canvasContainer = document.querySelector('.canvas-wrapper');
const canvasPlaceholder = document.getElementById('canvasPlaceholder');

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// UI Elements
const imageInput = document.getElementById('imageInput');
const addTextBtn = document.getElementById('addTextBtn');
const addTextBtnFull = document.getElementById('addTextBtnFull');
const downloadBtn = document.getElementById('downloadBtn');
const textBoxesList = document.getElementById('textBoxesList');
const templatesGallery = document.getElementById('templatesGallery');

// State
let currentImage = null;
let textBoxes = [];
let nextId = 1;
let selectedTextBox = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

// Template images from assets folder
const templateImages = [
    'assets/image.png',
    'assets/Laughing-Leo-meme-4acd7j.jpg'
];

// Initialize
imageInput.addEventListener('change', handleImageUpload);
addTextBtn.addEventListener('click', addTextBox);
addTextBtnFull.addEventListener('click', addTextBox);
downloadBtn.addEventListener('click', downloadMeme);

// Load templates on page load
loadTemplates();

// Load template images
function loadTemplates() {
    templatesGallery.innerHTML = '';
    
    templateImages.forEach(templatePath => {
        const templateItem = document.createElement('div');
        templateItem.className = 'template-item';
        
        const img = document.createElement('img');
        img.src = templatePath;
        img.alt = 'Template';
        img.className = 'template-thumbnail';
        
        img.onerror = function() {
            console.warn(`Failed to load template: ${templatePath}`);
            templateItem.remove();
        };
        
        templateItem.appendChild(img);
        templateItem.addEventListener('click', () => loadTemplate(templatePath));
        
        templatesGallery.appendChild(templateItem);
    });
}

// Load template image
function loadTemplate(imagePath) {
    const img = new Image();
    img.onerror = function() {
        alert('Error loading the template image. Please try again.');
    };
    img.onload = function() {
        currentImage = img;
        setupCanvas(img);
        canvasPlaceholder.classList.add('hidden');
        canvas.style.display = 'block';
        // Clear text boxes when loading new image
        textBoxes = [];
        selectedTextBox = null;
        renderTextBoxControls();
        redrawCanvas();
    };
    img.src = imagePath;
}

// Image upload handler
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        return;
    }
    
    const reader = new FileReader();
    reader.onerror = function() {
        alert('Error reading the file. Please try again.');
    };
    
    reader.onload = function(event) {
        const img = new Image();
        img.onerror = function() {
            alert('Error loading the image. Please try a different file.');
        };
        img.onload = function() {
            currentImage = img;
            setupCanvas(img);
            canvasPlaceholder.classList.add('hidden');
            canvas.style.display = 'block';
            // Clear text boxes when loading new image
            textBoxes = [];
            selectedTextBox = null;
            renderTextBoxControls();
            redrawCanvas();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// Setup canvas dimensions
function setupCanvas(img) {
    const maxWidth = canvasContainer.clientWidth - 40;
    const maxHeight = window.innerHeight * 0.8;
    
    let width = img.width;
    let height = img.height;
    
    // Scale to fit container
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
}

// Add new text box
function addTextBox() {
    if (!currentImage) {
        alert('Please upload an image first!');
        return;
    }
    
    const textBox = {
        id: nextId++,
        text: 'Your text here',
        x: canvas.width / 2,
        y: canvas.height / 2,
        fontSize: 40,
        color: '#FFFFFF',
        maxWidth: canvas.width * 0.9
    };
    
    textBoxes.push(textBox);
    selectedTextBox = textBox;
    renderTextBoxControls();
    redrawCanvas();
}

// Render text box controls in sidebar
function renderTextBoxControls() {
    textBoxesList.innerHTML = '';
    
    textBoxes.forEach(textBox => {
        const item = document.createElement('div');
        item.className = 'text-box-item';
        if (selectedTextBox && selectedTextBox.id === textBox.id) {
            item.classList.add('selected');
        }
        
        item.innerHTML = `
            <div class="text-box-item-header">
                <label>Text Box ${textBox.id}</label>
                <button class="delete-btn" data-id="${textBox.id}">Delete</button>
            </div>
            <input type="text" class="text-input" data-id="${textBox.id}" value="${escapeHtml(textBox.text)}" placeholder="Enter text" autocomplete="off">
            <div class="color-control">
                <label>Color:</label>
                <input type="color" class="color-picker" data-id="${textBox.id}" value="${textBox.color || '#FFFFFF'}">
            </div>
            <div class="size-control">
                <label>Size:</label>
                <input type="range" class="size-slider" data-id="${textBox.id}" min="10" max="300" value="${textBox.fontSize}">
                <span class="size-value">${textBox.fontSize}px</span>
            </div>
        `;
        
        textBoxesList.appendChild(item);
    });
    
    // Add event listeners
    document.querySelectorAll('.text-input').forEach(input => {
        input.addEventListener('input', function() {
            const id = parseInt(this.dataset.id);
            const textBox = textBoxes.find(tb => tb.id === id);
            if (textBox) {
                textBox.text = this.value;
                redrawCanvas();
            }
        });
        
        // Auto-focus the input for the selected text box
        const id = parseInt(input.dataset.id);
        if (selectedTextBox && selectedTextBox.id === id) {
            input.focus();
            input.select();
        }
    });
    
    document.querySelectorAll('.color-picker').forEach(picker => {
        picker.addEventListener('input', function() {
            const id = parseInt(this.dataset.id);
            const textBox = textBoxes.find(tb => tb.id === id);
            if (textBox) {
                textBox.color = this.value;
                redrawCanvas();
            }
        });
    });
    
    document.querySelectorAll('.size-slider').forEach(slider => {
        slider.addEventListener('input', function() {
            const id = parseInt(this.dataset.id);
            const textBox = textBoxes.find(tb => tb.id === id);
            if (textBox) {
                textBox.fontSize = parseInt(this.value);
                this.nextElementSibling.textContent = this.value + 'px';
                redrawCanvas();
            }
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            removeTextBox(id);
        });
    });
    
    // Select text box on click
    document.querySelectorAll('.text-box-item').forEach(item => {
        item.addEventListener('click', function(e) {
            if (e.target.classList.contains('delete-btn')) return;
            if (e.target.classList.contains('text-input')) return; // Don't interfere with input clicks
            if (e.target.classList.contains('color-picker')) return; // Don't interfere with color picker
            if (e.target.classList.contains('size-slider')) return; // Don't interfere with slider
            const id = parseInt(this.querySelector('.text-input').dataset.id);
            selectTextBox(id);
        });
    });
}

// Select a text box
function selectTextBox(id) {
    selectedTextBox = textBoxes.find(tb => tb.id === id);
    renderTextBoxControls();
    redrawCanvas();
    
    // Focus the input after a short delay to ensure it's rendered
    setTimeout(() => {
        const input = document.querySelector(`.text-input[data-id="${id}"]`);
        if (input) {
            input.focus();
            input.select();
        }
    }, 10);
}

// Remove text box
function removeTextBox(id) {
    textBoxes = textBoxes.filter(tb => tb.id !== id);
    if (selectedTextBox && selectedTextBox.id === id) {
        selectedTextBox = textBoxes.length > 0 ? textBoxes[0] : null;
    }
    renderTextBoxControls();
    redrawCanvas();
}

// Redraw canvas with image and all text
function redrawCanvas() {
    if (!currentImage) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw image
    ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);
    
    // Draw all text boxes
    textBoxes.forEach(textBox => {
        drawText(textBox, textBox === selectedTextBox);
    });
}

// Wrap text into multiple lines
function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];
    
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
}

// Draw text with white fill and black stroke (supports multi-line)
function drawText(textBox, isSelected = false) {
    ctx.save();
    
    // Set font
    ctx.font = `bold ${textBox.fontSize}px Impact, Arial Black, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Calculate max width for wrapping (use textBox maxWidth or default to 90% of canvas)
    const maxWidth = textBox.maxWidth || canvas.width * 0.9;
    
    // Wrap text into lines
    const lines = wrapText(ctx, textBox.text, maxWidth);
    const lineHeight = textBox.fontSize * 1.2;
    const totalHeight = lines.length * lineHeight;
    const startY = textBox.y - (totalHeight / 2) + (lineHeight / 2);
    
    // Calculate maximum line width for selection box
    let maxLineWidth = 0;
    lines.forEach(line => {
        const metrics = ctx.measureText(line);
        if (metrics.width > maxLineWidth) {
            maxLineWidth = metrics.width;
        }
    });
    
    // Draw each line with stroke and fill
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(4, textBox.fontSize / 8);
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    
    ctx.fillStyle = textBox.color || '#FFFFFF';
    
    lines.forEach((line, index) => {
        const y = startY + (index * lineHeight);
        
        // Draw black stroke (border)
        ctx.strokeText(line, textBox.x, y);
        
        // Draw text fill with selected color
        ctx.fillText(line, textBox.x, y);
    });
    
    // Draw selection indicator
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
}

// Mouse events for dragging
canvas.addEventListener('mousedown', handleMouseDown);
canvas.addEventListener('mousemove', handleMouseMove);
canvas.addEventListener('mouseup', handleMouseUp);
canvas.addEventListener('mouseleave', handleMouseUp);

function handleMouseDown(e) {
    if (!currentImage) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    // Check if clicking on a text box
    for (let i = textBoxes.length - 1; i >= 0; i--) {
        const textBox = textBoxes[i];
        ctx.font = `bold ${textBox.fontSize}px Impact, Arial Black, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Calculate text dimensions (accounting for wrapping)
        const maxWidth = textBox.maxWidth || canvas.width * 0.9;
        const lines = wrapText(ctx, textBox.text, maxWidth);
        const lineHeight = textBox.fontSize * 1.2;
        const totalHeight = lines.length * lineHeight;
        
        // Find maximum line width
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
            
            selectedTextBox = textBox;
            isDragging = true;
            dragOffset.x = x - textBox.x;
            dragOffset.y = y - textBox.y;
            renderTextBoxControls();
            redrawCanvas();
            return;
        }
    }
    
    // Clicked on empty space - deselect
    selectedTextBox = null;
    renderTextBoxControls();
    redrawCanvas();
}

function handleMouseMove(e) {
    if (!isDragging || !selectedTextBox) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    selectedTextBox.x = x - dragOffset.x;
    selectedTextBox.y = y - dragOffset.y;
    
    // Keep text within canvas bounds
    selectedTextBox.x = Math.max(0, Math.min(canvas.width, selectedTextBox.x));
    selectedTextBox.y = Math.max(0, Math.min(canvas.height, selectedTextBox.y));
    
    redrawCanvas();
}

function handleMouseUp() {
    isDragging = false;
}

// Download meme
function downloadMeme() {
    if (!currentImage) {
        alert('Please upload an image first!');
        return;
    }
    
    // Create a temporary canvas at full resolution
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = currentImage.width;
    tempCanvas.height = currentImage.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Draw image
    tempCtx.drawImage(currentImage, 0, 0);
    
    // Draw all text boxes scaled to full resolution
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
        
        // Wrap text into lines
        const lines = wrapText(tempCtx, textBox.text, scaledMaxWidth);
        const lineHeight = scaledFontSize * 1.2;
        const totalHeight = lines.length * lineHeight;
        const startY = scaledY - (totalHeight / 2) + (lineHeight / 2);
        
        // Draw each line with stroke and fill
        tempCtx.strokeStyle = '#000000';
        tempCtx.lineWidth = Math.max(4, scaledFontSize / 8);
        tempCtx.lineJoin = 'round';
        tempCtx.miterLimit = 2;
        
        tempCtx.fillStyle = textBox.color || '#FFFFFF';
        
        lines.forEach((line, index) => {
            const y = startY + (index * lineHeight);
            
            // Draw black stroke
            tempCtx.strokeText(line, scaledX, y);
            
            // Draw text fill
            tempCtx.fillText(line, scaledX, y);
        });
        
        tempCtx.restore();
    });
    
    // Convert to image and download
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
}

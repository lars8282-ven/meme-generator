# Meme Generator

A simple, clean meme generator that allows you to create memes with custom text overlays on images.

## Features

- Upload your own images or use built-in templates
- Add multiple text boxes with customizable:
  - Text content
  - Font size
  - Text color
  - Position (drag to move)
- Multi-line text support with automatic word wrapping
- Download your memes as PNG images

## How to Use

1. Choose a template from the gallery or upload your own image
2. Click "Add Text Box" to add text overlays
3. Customize your text using the controls in the sidebar
4. Drag text boxes to position them on the image
5. Click "Download Meme" to save your creation

## Deployment

This is a static website that can be deployed to any static hosting service.

### Quick Deploy Options:

#### Option 1: Netlify Drop (Easiest)
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag and drop this entire folder
3. Your site will be live instantly!

#### Option 2: Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in this directory
3. Follow the prompts

#### Option 3: GitHub Pages
1. Create a new GitHub repository
2. Push this code to the repository
3. Go to Settings > Pages
4. Select the main branch and save
5. Your site will be available at `https://yourusername.github.io/repository-name`

## Local Development

Simply open `index.html` in a web browser, or use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js (http-server)
npx http-server

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.


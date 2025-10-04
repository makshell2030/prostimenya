// Three.js Floating Hearts Background with Page-Based Text
class FloatingHeartsBackground {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.hearts = [];
        this.texts = [];
        this.currentPage = 1;
        this.pageTexts = {}; // Remove page-specific mapping
        this.constantPhrases = [
            'Прости меня', 'Булочка', 'Солнышко', 'Жена', 'Жёнушка', 
            'Красотка', 'Милашка', 'Любимая', 'Зайчик', 'Дорогая', 
            'Котенок', 'Принцесса', 'Зайка', 'Судьба', 'Созданы друг для друга'
        ]; // All words float constantly
        this.extraPhrases = ['Давай всё вернем', 'Дай мне шанс', 'Прости меня']; // Additional phrases including extra "Прости меня"
        this.lastTextTime = 0;
        this.activeTexts = new Set(); // Track active texts to prevent overlapping
        this.init();
    }

    init() {
        this.setupScene();
        this.createFloatingHearts();
        this.watchForPageChanges();
        this.animate();
        this.handleResize();
    }

    setupScene() {
        // Scene setup
        this.scene = new THREE.Scene();
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        this.camera.position.z = 30;

        // Renderer setup
        const canvas = document.getElementById('background-canvas');
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            alpha: true,
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000, 0); // Transparent background
    }

    watchForPageChanges() {
        // Watch for page changes every 1 second
        setInterval(() => {
            // Check current page by looking at visible page - improved detection
            const pages = document.querySelectorAll('.page');
            let newCurrentPage = 1;
            
            // Also check for book pages
            const bookPages = document.querySelectorAll('[id^="page-"]');
            
            pages.forEach((page, index) => {
                if (!page.classList.contains('hidden')) {
                    newCurrentPage = index + 1;
                }
            });
            
            // Check book pages if main pages detection fails
            bookPages.forEach((page, index) => {
                if (!page.classList.contains('hidden')) {
                    newCurrentPage = index + 1;
                }
            });
            
            // Check if book is open by looking for visible book container
            const bookContainer = document.querySelector('.book-container');
            const isBookOpen = bookContainer && !bookContainer.classList.contains('hidden');
            
            if (isBookOpen) {
                // Find which book page is active
                const activePageElement = document.querySelector('.page.active') || 
                                        document.querySelector('.page:not(.hidden)') ||
                                        document.querySelector('[class*="page-"]:not(.hidden)');
                
                if (activePageElement) {
                    // Extract page number from class or id
                    const pageMatch = activePageElement.className.match(/page-(\d+)/) || 
                                    activePageElement.id.match(/page-(\d+)/);
                    if (pageMatch) {
                        newCurrentPage = parseInt(pageMatch[1]);
                    }
                }
            }
            
            if (newCurrentPage !== this.currentPage) {
                console.log(`Page changed from ${this.currentPage} to ${newCurrentPage}`);
                this.currentPage = newCurrentPage;
                // Don't clear old texts immediately - let them fade out naturally
            }
        }, 1000);
    }

    clearOldTexts() {
        // Remove all existing floating texts
        this.texts.forEach(textMesh => {
            this.scene.remove(textMesh);
        });
        this.texts = [];
        this.activeTexts.clear();
        this.lastTextTime = 0; // Reset timer to create new text soon
    }

    createFloatingText(text) {
        // Allow maximum 5 texts on screen at once for richer experience
        if (this.texts.length >= 5) {
            return;
        }
        
        // Prevent creating the same text if it's already active
        const textAlreadyActive = this.texts.some(textMesh => textMesh.userData.text === text);
        if (textAlreadyActive) {
            return;
        }
        
        // Create canvas for text with cloud PNG background
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 600;
        canvas.height = 200;
        
        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Load and draw cloud image
        const cloudImg = new Image();
        cloudImg.onload = () => {
            // Draw cloud image with background removal and proper scaling
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            
            // Calculate proper scaling to fit canvas while maintaining aspect ratio
            const imgAspect = cloudImg.width / cloudImg.height;
            const canvasAspect = canvas.width / canvas.height;
            
            let drawWidth, drawHeight;
            if (imgAspect > canvasAspect) {
                // Image is wider - fit to canvas width
                drawWidth = canvas.width * 0.8; // 80% of canvas width
                drawHeight = drawWidth / imgAspect;
            } else {
                // Image is taller - fit to canvas height
                drawHeight = canvas.height * 0.8; // 80% of canvas height
                drawWidth = drawHeight * imgAspect;
            }
            
            // Create a temporary canvas for background removal
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = drawWidth;
            tempCanvas.height = drawHeight;
            
            // Draw image to temp canvas
            tempCtx.drawImage(cloudImg, 0, 0, drawWidth, drawHeight);
            
            // Get image data for background removal
            const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            const data = imageData.data;
            
            // Remove white/light backgrounds (make transparent)
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                
                // If pixel is close to white or very light, make it transparent
                if (r > 240 && g > 240 && b > 240) {
                    data[i + 3] = 0; // Set alpha to 0 (transparent)
                }
                // For light gray areas, reduce opacity
                else if (r > 200 && g > 200 && b > 200) {
                    data[i + 3] = data[i + 3] * 0.3; // Make 30% opacity
                }
                // For medium tones, keep some transparency
                else if (r > 150 && g > 150 && b > 150) {
                    data[i + 3] = data[i + 3] * 0.6; // Make 60% opacity
                }
            }
            
            // Put the modified image data back
            tempCtx.putImageData(imageData, 0, 0);
            
            // Draw the processed cloud to main canvas with additional transparency
            context.save();
            context.globalAlpha = 0.8; // Additional transparency layer
            context.drawImage(tempCanvas, 
                centerX - drawWidth/2, 
                centerY - drawHeight/2
            );
            context.restore();
            
            // Style the text - romantic rose color matching theme
            context.fillStyle = 'rgba(214, 51, 132, 0.95)';
            context.font = 'bold 38px "Dancing Script", Arial, sans-serif';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            
            // Add text shadow for readability on cloud
            context.shadowColor = 'rgba(255, 255, 255, 0.9)';
            context.shadowBlur = 3;
            context.shadowOffsetX = 1;
            context.shadowOffsetY = 1;
            
            // Draw the text centered on cloud
            context.fillText(text, centerX, centerY);
            
            // Update texture after image loads
            texture.needsUpdate = true;
        };
        cloudImg.src = 'clouds.png';
        
        // Create texture and material
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0.9
        });
        
        // Create plane geometry for the text with cloud
        const geometry = new THREE.PlaneGeometry(18, 6);
        const textMesh = new THREE.Mesh(geometry, material);
        
        // Position randomly off-screen (from both left and right sides)
        const side = Math.random() < 0.5 ? -1 : 1; // -1 = left side, 1 = right side
        if (side === 1) {
            // Start from right side
            textMesh.position.x = 60 + Math.random() * 20;
        } else {
            // Start from left side
            textMesh.position.x = -60 - Math.random() * 20;
        }
        textMesh.position.y = (Math.random() - 0.5) * 25; // Smaller Y range for gentler movement
        textMesh.position.z = 5; // Bring closer to camera
        
        // Animation properties - varied speeds for more natural movement
        textMesh.userData = {
            speed: 0.02 + Math.random() * 0.04, // More varied slower movement (0.02-0.06)
            direction: -side, // Move towards opposite side
            life: 0,
            maxLife: 1200 + Math.random() * 800, // Even longer life for more overlap (1200-2000)
            rotationSpeed: (Math.random() - 0.5) * 0.0003, // Very minimal rotation
            text: text,
            startSide: side
        };
        
        this.texts.push(textMesh);
        this.scene.add(textMesh);
        
        console.log(`Added floating text for page ${this.currentPage}: ${text}`);
    }

    createHeartShape() {
        // Create simple heart shape
        const heartShape = new THREE.Shape();
        
        heartShape.moveTo(0, -3);
        heartShape.bezierCurveTo(0, -3, -2, -5, -4, -3);
        heartShape.bezierCurveTo(-6, -1, -6, 1, -4, 3);
        heartShape.bezierCurveTo(-2, 5, 0, 7, 0, 7);
        heartShape.bezierCurveTo(0, 7, 2, 5, 4, 3);
        heartShape.bezierCurveTo(6, 1, 6, -1, 4, -3);
        heartShape.bezierCurveTo(2, -5, 0, -3, 0, -3);

        const geometry = new THREE.ShapeGeometry(heartShape);
        return geometry;
    }

    createFloatingHearts() {
        const heartGeometry = this.createHeartShape();
        
        // Create 25 small floating hearts
        for (let i = 0; i < 25; i++) {
            const material = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(0.95, 0.8, 0.7), // Soft pink
                transparent: true,
                opacity: Math.random() * 0.4 + 0.2 // 0.2 to 0.6 opacity
            });
            
            const heart = new THREE.Mesh(heartGeometry, material);
            
            // Random position across the screen
            heart.position.x = (Math.random() - 0.5) * 80;
            heart.position.y = (Math.random() - 0.5) * 60;
            heart.position.z = (Math.random() - 0.5) * 40;
            
            // Small, consistent size
            const scale = Math.random() * 0.3 + 0.2; // 0.2 to 0.5 scale
            heart.scale.set(scale, scale, scale);
            
            // Random rotation
            heart.rotation.z = Math.random() * Math.PI * 2;
            
            // Animation properties
            heart.userData = {
                originalY: heart.position.y,
                originalX: heart.position.x,
                speed: Math.random() * 0.015 + 0.005, // Slow floating speed
                rotationSpeed: (Math.random() - 0.5) * 0.01, // Gentle rotation
                floatOffset: Math.random() * Math.PI * 2,
                driftSpeed: Math.random() * 0.008 + 0.002
            };
            
            this.hearts.push(heart);
            this.scene.add(heart);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const time = Date.now() * 0.001;
        
        // Create floating text constantly (very frequent - every 0.2-0.5 seconds)
        if (time - this.lastTextTime > (0.2 + Math.random() * 0.3)) {
            // Randomly pick from all constant phrases with "Прости меня" appearing more often
            const allPhrases = [...this.constantPhrases, ...this.extraPhrases];
            // Add extra "Прости меня" entries to make it appear more frequently
            const prostiMenyaExtra = ['Прости меня', 'Прости меня', 'Прости меня'];
            const phrasePool = [...allPhrases, ...prostiMenyaExtra];
            
            const randomPhrase = phrasePool[Math.floor(Math.random() * phrasePool.length)];
            this.createFloatingText(randomPhrase);
            this.lastTextTime = time;
        }
        
        // Also add additional random phrases very frequently 
        if (Math.random() < 0.08 && this.texts.length < 5) { // 8% chance each frame, allow 5 texts
            const phrasePool = [...this.constantPhrases, ...this.extraPhrases, 'Прости меня', 'Прости меня'];
            const randomPhrase = phrasePool[Math.floor(Math.random() * phrasePool.length)];
            this.createFloatingText(randomPhrase);
        }
        
        // Animate floating text
        for (let i = this.texts.length - 1; i >= 0; i--) {
            const textMesh = this.texts[i];
            
            // Move text across screen (from either direction)
            textMesh.position.x += textMesh.userData.direction * textMesh.userData.speed;
            
            // Very gentle floating motion
            textMesh.position.y += Math.sin(time * 1.2 + textMesh.userData.life * 0.03) * 0.008;
            
            // Minimal rotation
            textMesh.rotation.z += textMesh.userData.rotationSpeed;
            
            // Fade out when near either edge
            const lifeProgress = textMesh.userData.life / textMesh.userData.maxLife;
            let nearEdge = false;
            
            if (textMesh.userData.startSide === 1) {
                // Started from right, moving left
                nearEdge = textMesh.position.x < -50;
            } else {
                // Started from left, moving right
                nearEdge = textMesh.position.x > 50;
            }
            
            if (lifeProgress > 0.7 || nearEdge) {
                if (nearEdge) {
                    // Fade based on distance from edge
                    const edgeProgress = textMesh.userData.startSide === 1 ? 
                        Math.max(0, (textMesh.position.x + 70) / 20) : 
                        Math.max(0, (70 - textMesh.position.x) / 20);
                    textMesh.material.opacity = Math.max(0, edgeProgress);
                } else {
                    // Fade based on life progress
                    textMesh.material.opacity = Math.max(0, (1 - lifeProgress) * 3.33);
                }
            }
            
            // Update life and remove when completely off screen
            textMesh.userData.life++;
            const completelyOffScreen = textMesh.userData.startSide === 1 ? 
                textMesh.position.x < -110 : 
                textMesh.position.x > 110;
                
            if (completelyOffScreen || textMesh.userData.life > textMesh.userData.maxLife * 1.5) {
                this.scene.remove(textMesh);
                this.texts.splice(i, 1);
            }
        }
        
        // Animate each heart
        this.hearts.forEach(heart => {
            // Gentle floating up and down
            heart.position.y = heart.userData.originalY + Math.sin(time * heart.userData.speed + heart.userData.floatOffset) * 3;
            
            // Gentle side-to-side drift
            heart.position.x = heart.userData.originalX + Math.sin(time * heart.userData.driftSpeed + heart.userData.floatOffset * 0.5) * 2;
            
            // Slow rotation
            heart.rotation.z += heart.userData.rotationSpeed;
            
            // Very subtle size pulsing
            const pulse = Math.sin(time * 1.5 + heart.userData.floatOffset) * 0.05 + 1;
            const baseScale = heart.scale.x / pulse; // Get original scale
            heart.scale.setScalar(baseScale * pulse);
        });
        
        this.renderer.render(this.scene, this.camera);
    }

    handleResize() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
}

// Global reference for communication with other scripts
let floatingBackground;

// Initialize the floating hearts background when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    floatingBackground = new FloatingHeartsBackground();
});
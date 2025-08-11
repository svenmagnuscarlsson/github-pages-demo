// ImageCropTool class for handling image selection and measurement
class ImageCropTool {
    constructor() {
        // DOM-element
        this.canvas = document.getElementById('imageCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.selectionBox = document.getElementById('selectionBox');
        this.imageInput = document.getElementById('imageInput');
        this.imageSizeSelect = document.getElementById('imageSizeSelect');
        this.themeToggle = document.getElementById('themeToggle');
        
        // Variabler för tillstånd
        this.image = null;
        this.isSelecting = false; // Sant när en ny ruta ritas
        this.isMoving = false;    // Sant när en befintlig ruta flyttas
        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        
        // Verklig bildstorlek (användarens val) och skalfaktor
        this.actualImageWidth = 1920;
        this.actualImageHeight = 1080;
        this.scaleFactor = 1;
        
        this.initializeEventListeners();
    }

    // Ställ in händelselyssnare
    initializeEventListeners() {
        this.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        this.imageSizeSelect.addEventListener('change', (e) => this.handleSizeChange(e));
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Lyssna på händelser för att rita en ny ruta på canvasen
        this.canvas.addEventListener('mousedown', (e) => this.startSelection(e));
        this.canvas.addEventListener('mousemove', (e) => this.updateSelection(e));
        
        // Lyssna på händelser för att flytta den befintliga rutan
        this.selectionBox.addEventListener('mousedown', (e) => this.startMoving(e));
        
        // Lyssna på globala mus-upp händelser för att stoppa all interaktion
        document.addEventListener('mouseup', () => this.endInteraction());
        document.addEventListener('mousemove', (e) => this.dragSelection(e));
    }

    // Hantera uppladdning av bildfil
    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.image = new Image();
            this.image.onload = () => {
                this.displayImage();
                this.clearResults();
            };
            this.image.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Hantera ändring av den valda bildstorleken
    handleSizeChange(event) {
        const [width, height] = event.target.value.split('x').map(Number);
        this.actualImageWidth = width;
        this.actualImageHeight = height;
        this.displayImage(); // Uppdatera skalan baserat på den nya storleken
        this.clearResults();
    }

    // Rita ut bilden på canvas-elementet
    displayImage() {
        if (!this.image) return;

        // Beräkna visningsstorlek för canvas (begränsa till maxbredd/höjd)
        const maxWidth = 800;
        const maxHeight = 600;
        let displayWidth = this.image.width;
        let displayHeight = this.image.height;
        
        const widthRatio = maxWidth / displayWidth;
        const heightRatio = maxHeight / displayHeight;
        const scale = Math.min(widthRatio, heightRatio);

        displayWidth = displayWidth * scale;
        displayHeight = displayHeight * scale;

        // Uppdatera canvas-storlek och rita ut bilden
        this.canvas.width = displayWidth;
        this.canvas.height = displayHeight;
        this.ctx.drawImage(this.image, 0, 0, displayWidth, displayHeight);

        // Beräkna skalfaktorn för att översätta canvas-pixlar till användarens verkliga pixlar
        this.scaleFactor = this.actualImageWidth / displayWidth;

        this.hideSelectionBox();
    }

    // Starta ritningen av en ny ruta
    startSelection(event) {
        if (!this.image) return;
        
        const rect = this.canvas.getBoundingClientRect();
        this.startX = event.clientX - rect.left;
        this.startY = event.clientY - rect.top;
        this.isSelecting = true;
        
        this.selectionBox.style.display = 'block';
        this.updateSelectionBox();
    }

    // Uppdatera ritningen av en ny ruta
    updateSelection(event) {
        if (!this.isSelecting || !this.image) return;
        
        const rect = this.canvas.getBoundingClientRect();
        this.currentX = event.clientX - rect.left;
        this.currentY = event.clientY - rect.top;
        
        this.updateSelectionBox();
        this.calculateAndDisplayResults();
    }

    // Starta flyttningen av en befintlig ruta
    startMoving(event) {
        if (!this.image) return;
        event.preventDefault();

        this.isMoving = true;
        const rect = this.selectionBox.getBoundingClientRect();
        this.dragOffsetX = event.clientX - rect.left;
        this.dragOffsetY = event.clientY - rect.top;

        // Ändra muspekaren för att visa att man kan flytta
        this.selectionBox.style.cursor = 'grabbing';
    }

    // Flytta den befintliga rutan
    dragSelection(event) {
        if (!this.isMoving || !this.image) return;
        
        const containerRect = this.canvas.parentElement.getBoundingClientRect();
        const newLeft = event.clientX - this.dragOffsetX;
        const newTop = event.clientY - this.dragOffsetY;
        
        // Begränsa flyttningen till canvasens område
        const canvasRect = this.canvas.getBoundingClientRect();
        const selectionRect = this.selectionBox.getBoundingClientRect();

        let clampedLeft = Math.max(canvasRect.left, newLeft);
        clampedLeft = Math.min(clampedLeft, canvasRect.right - selectionRect.width);
        
        let clampedTop = Math.max(canvasRect.top, newTop);
        clampedTop = Math.min(clampedTop, canvasRect.bottom - selectionRect.height);

        this.selectionBox.style.left = (clampedLeft - containerRect.left) + 'px';
        this.selectionBox.style.top = (clampedTop - containerRect.top) + 'px';

        // Uppdatera start-koordinaterna för den nya positionen
        this.startX = clampedLeft - canvasRect.left;
        this.startY = clampedTop - canvasRect.top;
        this.currentX = this.startX + selectionRect.width;
        this.currentY = this.startY + selectionRect.height;

        this.calculateAndDisplayResults();
    }
    
    // Avsluta all interaktion
    endInteraction() {
        this.isSelecting = false;
        this.isMoving = false;
        this.selectionBox.style.cursor = 'move';
    }

    // Uppdatera stil och position för urvalsrutan vid ritning
    updateSelectionBox() {
        const canvasRect = this.canvas.getBoundingClientRect();
        const containerRect = this.canvas.parentElement.getBoundingClientRect();
        
        const left = Math.min(this.startX, this.currentX);
        const top = Math.min(this.startY, this.currentY);
        const width = Math.abs(this.currentX - this.startX);
        const height = Math.abs(this.currentY - this.startY);
        
        this.selectionBox.style.left = (canvasRect.left - containerRect.left + left) + 'px';
        this.selectionBox.style.top = (canvasRect.top - containerRect.top + top) + 'px';
        this.selectionBox.style.width = width + 'px';
        this.selectionBox.style.height = height + 'px';
    }

    // Beräkna och visa resultaten
    calculateAndDisplayResults() {
        const selectionWidth = Math.abs(this.currentX - this.startX);
        const selectionHeight = Math.abs(this.currentY - this.startY);
        const selectionX = Math.min(this.startX, this.currentX);
        const selectionY = Math.min(this.startY, this.currentY);

        // Konvertera till verkliga bildkoordinater med skalfaktorn
        const realWidth = Math.round(selectionWidth * this.scaleFactor);
        const realHeight = Math.round(selectionHeight * this.scaleFactor);
        const realX = Math.round(selectionX * this.scaleFactor);
        const realY = Math.round(selectionY * this.scaleFactor);

        document.getElementById('widthResult').textContent = realWidth + 'px';
        document.getElementById('heightResult').textContent = realHeight + 'px';
        document.getElementById('xResult').textContent = realX + 'px';
        document.getElementById('yResult').textContent = realY + 'px';
    }

    // Dölj urvalsrutan
    hideSelectionBox() {
        this.selectionBox.style.display = 'none';
    }

    // Rensa resultatvisningen
    clearResults() {
        document.getElementById('widthResult').textContent = '-';
        document.getElementById('heightResult').textContent = '-';
        document.getElementById('xResult').textContent = '-';
        document.getElementById('yResult').textContent = '-';
        this.hideSelectionBox();
    }

    // Växla mellan ljus och mörk tema
    toggleTheme() {
        document.body.classList.toggle('dark');
    }
}

// Starta applikationen när sidan laddas
document.addEventListener('DOMContentLoaded', () => {
    new ImageCropTool();
});

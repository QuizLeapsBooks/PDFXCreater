const imageInput = document.getElementById('image-input');
const dropZone = document.getElementById('drop-zone');
const thumbnails = document.getElementById('thumbnails');
const doneBtn = document.getElementById('done-btn');
const loading = document.getElementById('loading');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const pdfNameInput = document.getElementById('pdf-name');
const previewModal = document.getElementById('preview-modal');
const modalImage = document.getElementById('modal-image');
const cropBtn = document.getElementById('crop-btn');
const rotateBtn = document.getElementById('rotate-btn');
const closeModal = document.getElementById('close-modal');
const pdfPreviewModal = document.getElementById('pdf-preview-modal');
const pdfPreview = document.getElementById('pdf-preview');
const downloadBtn = document.getElementById('download-btn');
const closePdfModal = document.getElementById('close-pdf-modal');
let images = [];
let currentImageIndex = null;
let cropper = null;

dropZone.addEventListener('click', () => imageInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
});

imageInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
    e.target.value = '';
});

function handleFiles(files) {
    files.forEach(file => {
        if (!file.type.startsWith('image/')) {
            alert('Bhai, sirf images daal (JPG/PNG)!');
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            images.push({ file, url: ev.target.result, rotation: 0 });
            renderThumbnails();
            doneBtn.disabled = images.length === 0;
        };
        reader.readAsDataURL(file);
    });
}

function renderThumbnails() {
    thumbnails.innerHTML = '';
    images.forEach((img, index) => {
        const div = document.createElement('div');
        div.className = 'thumbnail relative';
        div.draggable = true;
        div.innerHTML = `
            <img src="${img.url}" class="w-full h-32 object-cover rounded-lg shadow cursor-pointer">
            <button class="delete-btn absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center">×</button>
        `;
        div.querySelector('img').addEventListener('click', () => {
            currentImageIndex = index;
            modalImage.src = img.url;
            previewModal.classList.remove('hidden');
            if (cropper) cropper.destroy();
            cropper = new Cropper(modalImage, { aspectRatio: 0, viewMode: 1 });
        });
        div.querySelector('.delete-btn').addEventListener('click', () => {
            images.splice(index, 1);
            renderThumbnails();
            doneBtn.disabled = images.length === 0;
        });
        div.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', index);
        });
        div.addEventListener('dragover', (e) => e.preventDefault());
        div.addEventListener('drop', (e) => {
            e.preventDefault();
            const fromIndex = e.dataTransfer.getData('text/plain');
            const toIndex = index;
            [images[fromIndex], images[toIndex]] = [images[toIndex], images[fromIndex]];
            renderThumbnails();
        });
        thumbnails.appendChild(div);
    });
}

cropBtn.addEventListener('click', () => {
    if (cropper) {
        const croppedCanvas = cropper.getCroppedCanvas();
        images[currentImageIndex].url = croppedCanvas.toDataURL('image/jpeg');
        cropper.destroy();
        cropper = null;
        previewModal.classList.add('hidden');
        renderThumbnails();
    }
});

rotateBtn.addEventListener('click', () => {
    images[currentImageIndex].rotation = (images[currentImageIndex].rotation + 90) % 360;
    modalImage.style.transform = `rotate(${images[currentImageIndex].rotation}deg)`;
    cropper.destroy();
    cropper = new Cropper(modalImage, { aspectRatio: 0, viewMode: 1 });
});

closeModal.addEventListener('click', () => {
    if (cropper) cropper.destroy();
    cropper = null;
    previewModal.classList.add('hidden');
});

doneBtn.addEventListener('click', async () => {
    if (images.length === 0) return;
    loading.classList.remove('hidden');
    progressContainer.classList.remove('hidden');
    doneBtn.disabled = true;
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    for (let i = 0; i < images.length; i++) {
        if (i > 0) pdf.addPage();
        const img = new Image();
        img.src = images[i].url;
        await new Promise(resolve => { img.onload = resolve; });
        const imgProps = pdf.getImageProperties(img);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
        const yPos = imgHeight < pdfHeight ? (pdfHeight - imgHeight) / 2 : 0;
        pdf.addImage(img, 'JPEG', 0, yPos, pdfWidth, imgHeight, null, 'FAST', images[i].rotation);
        progressBar.style.width = `${((i + 1) / images.length) * 100}%`;
    }
    const pdfBlob = pdf.output('blob');
    pdfPreview.src = URL.createObjectURL(pdfBlob);
    pdfPreviewModal.classList.remove('hidden');
    loading.classList.add('hidden');
    progressContainer.classList.add('hidden');
    doneBtn.disabled = false;
});

downloadBtn.addEventListener('click', () => {
    const pdfName = pdfNameInput.value.trim() || 'my_pdf';
    const link = document.createElement('a');
    link.href = pdfPreview.src;
    link.download = `${pdfName}.pdf`;
    link.click();
    pdfPreviewModal.classList.add('hidden');
});

closePdfModal.addEventListener('click', () => {
    pdfPreviewModal.classList.add('hidden');
});
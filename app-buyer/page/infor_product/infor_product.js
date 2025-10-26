//Tạo ảnh sản phẩm ẩn
function setupGalleryThumbnails() {
    const galleryItems = document.querySelectorAll('.gallery__thumbnails input.gallery__input');
    const maxVisible = 6;

    if (galleryItems.length > maxVisible) {
        const hiddenCount = galleryItems.length - maxVisible;

        // Ẩn các thumbnail từ vị trí thứ 7 trở đi
        galleryItems.forEach((input, index) => {
            if (index >= maxVisible) {
                // Ẩn input và label để sau chạy tính rồi thêm
                input.style.display = 'none';
                const label = input.nextElementSibling;
                if (label) {
                    label.style.display = 'none';
                }
            }
        });

        // Thêm class và overlay cho thumbnail thứ 6
        const sixthInput = galleryItems[maxVisible - 1];
        const sixthThumb = sixthInput.nextElementSibling;

        if (sixthThumb) {
            sixthThumb.classList.add('gallery__thumbnail--more');

            // Tạo overlay hiển thị số ảnh còn lại
            const overlay = document.createElement('div');
            overlay.className = 'gallery__thumbnail-overlay';
            overlay.textContent = `+${hiddenCount}`;
            sixthThumb.appendChild(overlay);
        }
    }
}
// Chạy khi DOM đã load xong
document.addEventListener('DOMContentLoaded', setupGalleryThumbnails);
// Quantity buttons
const quantityInput = document.getElementById('quantityInput');
const decreaseBtn = document.getElementById('decreaseBtn');
const increaseBtn = document.getElementById('increaseBtn');

// Kiểm tra xem các element có tồn tại không
if (quantityInput && decreaseBtn && increaseBtn) {
    
    decreaseBtn.addEventListener('click', () => {
        const currentValue = parseInt(quantityInput.value);
        if (currentValue > 1) {
            quantityInput.value = currentValue - 1;
        }
    });
    
    increaseBtn.addEventListener('click', () => {
        const currentValue = parseInt(quantityInput.value);
        if (currentValue > 0) {
            quantityInput.value = currentValue + 1;
        }
    });
    
    // Prevent invalid input
    quantityInput.addEventListener('input', () => {
        let value = parseInt(quantityInput.value);
        const min = parseInt(quantityInput.min) || 1;
        
        if (isNaN(value) || value < min) {
            quantityInput.value = min;
        }
    });
    
} else {
    console.error('ElementsError: quantityInput, decreaseBtn, or increaseBtn');
}


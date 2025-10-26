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


//Review nhiều ảnh hoặc chữ quá max thì ẩn bớt
document.addEventListener('DOMContentLoaded', function() {

    // ========== XỬ LÝ REVIEW PHOTOS ==========
    const reviewPhotosContainers = document.querySelectorAll('.review__photos');

    reviewPhotosContainers.forEach(container => {
        const photos = Array.from(container.querySelectorAll('.review__photo'));
        const totalPhotos = photos.length;
        const maxVisible = 3;

        // Nhiều hơn 3 ảnh
        if (totalPhotos > maxVisible) {
            // Ẩn các ảnh từ thứ 4 trở đi
            photos.forEach((photo, index) => {
                if (index >= maxVisible) {
                    photo.classList.add('review__photo--hidden');
                }
            });

            // Ảnh 3 thêm bóng mờ + số ảnh còn lại
            const lastVisiblePhoto = photos[maxVisible - 1];
            lastVisiblePhoto.classList.add('review__photo--more');

            // Làm mờ ảnh thừa
            const remainingCount = totalPhotos - maxVisible;
            const overlay = document.createElement('div');
            overlay.className = 'review__photo-overlay';
            overlay.textContent = `+${remainingCount}`;
            lastVisiblePhoto.appendChild(overlay);

            // Click để xem tất cả ảnh
            lastVisiblePhoto.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                // Hện tất cả ảnh
                photos.forEach(photo => {
                    photo.classList.remove('review__photo--hidden');
                });

                // Xóa mờ
                lastVisiblePhoto.classList.remove('review__photo--more');
                if (overlay.parentNode) {
                    overlay.remove();
                }
            });
        }
    });

    // Comment review hơn 100 chữ thì ẩn bớt
    const reviews = document.querySelectorAll('.review');

    reviews.forEach(review => {
        const textContainer = review.querySelector('.review__text-container');
        if (!textContainer) return;

        const textElement = textContainer.querySelector('.review__text');
        if (!textElement) return;

        const text = textElement.textContent.trim();
        const wordCount = text.split(/\s+/).length;
        const maxWords = 100;

        if (wordCount > maxWords) {
            // Modifier để truncate
            textElement.classList.add('review__text--truncated');

            // More
            const readMoreBtn = document.createElement('span');
            readMoreBtn.className = 'review__read-more';
            readMoreBtn.textContent = 'Xem thêm';

            textContainer.appendChild(readMoreBtn);

            // Xem thêm hoặc thu gọn
            let isExpanded = false;
            readMoreBtn.addEventListener('click', function() {
                isExpanded = !isExpanded;

                if (isExpanded) {
                    textElement.classList.remove('review__text--truncated');
                    readMoreBtn.textContent = 'Thu gọn';
                } else {
                    textElement.classList.add('review__text--truncated');
                    readMoreBtn.textContent = 'Xem thêm';

                    // Smooth scroll về vị trí review
                    textContainer.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest'
                    });
                }
            });
        }
    });
});
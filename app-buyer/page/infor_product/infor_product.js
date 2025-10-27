function setupGalleryAdvanced() {
    const gallery = document.querySelector('.gallery');
    if (!gallery) return;

    const mainDisplay = gallery.querySelector('.gallery__main');
    const thumbnailsContainer = gallery.querySelector('.gallery__thumbnails');
    const galleryInputs = Array.from(thumbnailsContainer.querySelectorAll('.gallery__input'));
    const galleryLabels = Array.from(thumbnailsContainer.querySelectorAll('.gallery__thumbnail'));

    const maxVisible = 6;
    let currentPage = 0;

    const thumbnailContents = galleryLabels.map(label => label.textContent.trim());

    function updateMainDisplay(content) {
        mainDisplay.classList.add('gallery__main--changing');
        mainDisplay.textContent = content;
        setTimeout(() => {
            mainDisplay.classList.remove('gallery__main--changing');
        }, 300);
    }

    function showPage(pageIndex) {
        currentPage = pageIndex;
        const startIdx = pageIndex * maxVisible;
        const endIdx = Math.min(startIdx + maxVisible, galleryInputs.length);
        const totalPages = Math.ceil(galleryInputs.length / maxVisible);

        galleryInputs.forEach((input, idx) => {
            galleryLabels[idx].style.display = 'none';
        });

        for (let i = startIdx; i < endIdx; i++) {
            galleryLabels[i].style.display = 'flex';

            galleryLabels[i].classList.remove('gallery__thumbnail--more', 'gallery__thumbnail--prev');
            const oldOverlay = galleryLabels[i].querySelector('.gallery__thumbnail-overlay');
            if (oldOverlay) oldOverlay.remove();
        }

        if (pageIndex > 0 && startIdx < galleryInputs.length) {
            const firstThumb = galleryLabels[startIdx];
            firstThumb.classList.add('gallery__thumbnail--prev');

            const prevCount = pageIndex * maxVisible;
            const prevOverlay = document.createElement('div');
            prevOverlay.className = 'gallery__thumbnail-overlay';
            prevOverlay.textContent = `+${prevCount}`;
            firstThumb.appendChild(prevOverlay);

            firstThumb.addEventListener('click', function(e) {
                e.preventDefault();
                showPage(pageIndex - 1);
            }, { once: true });
        }

        const remainingAfter = galleryInputs.length - endIdx;
        if (remainingAfter > 0 && endIdx > startIdx) {
            const lastVisibleIdx = endIdx - 1;
            const lastThumb = galleryLabels[lastVisibleIdx];
            lastThumb.classList.add('gallery__thumbnail--more');

            const moreOverlay = document.createElement('div');
            moreOverlay.className = 'gallery__thumbnail-overlay';
            moreOverlay.textContent = `+${remainingAfter}`;
            lastThumb.appendChild(moreOverlay);

            lastThumb.addEventListener('click', function(e) {
                e.preventDefault();
                if (pageIndex + 1 < totalPages) {
                    showPage(pageIndex + 1);
                }
            }, { once: true });
        }
    }

    galleryInputs.forEach((input, index) => {
        input.addEventListener('change', function() {
            if (this.checked) {
                updateMainDisplay(thumbnailContents[index]);
            }
        });

        galleryLabels[index].addEventListener('click', function(e) {
            if (!this.classList.contains('gallery__thumbnail--more') &&
                !this.classList.contains('gallery__thumbnail--prev')) {
                updateMainDisplay(thumbnailContents[index]);
            }
        });
    });

    showPage(0);

    if (thumbnailContents.length > 0) {
        updateMainDisplay(thumbnailContents[0]);
    }
}

document.addEventListener('DOMContentLoaded', setupGalleryAdvanced);

//Review nhiều ảnh hoặc chữ quá max thì ẩn bớt
document.addEventListener('DOMContentLoaded', function() {

    // Review photo nhiều ảnh
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

                // Hiện tất cả ảnh
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

    // Thay đổi số lượng sản phẩm -> thay đổi giá
    const quantityInput = document.getElementById('quantityInput');
    const decreaseBtn = document.getElementById('decreaseBtn');
    const increaseBtn = document.getElementById('increaseBtn');
    const currentPriceElement = document.querySelector('.purchase__current-price');
    const originalPriceElement = document.querySelector('.purchase__original-price');

    if (quantityInput && decreaseBtn && increaseBtn && currentPriceElement && originalPriceElement) {

        // Lấy giá gốc từ HTML
        function parsePriceFromText(text) {
            return parseInt(text.replace(/[^\d]/g, ''));
        }

        const basePrice = parsePriceFromText(currentPriceElement.textContent);
        const baseOriginalPrice = parsePriceFromText(originalPriceElement.textContent);

        // Format tiền VNĐ
        function formatPrice(price) {
            return price.toLocaleString('vi-VN') + '₫';
        }

        // Cập nhật giá
        function updatePrice() {
            const quantity = parseInt(quantityInput.value) || 1;
            const newPrice = basePrice * quantity;
            const newOriginalPrice = baseOriginalPrice * quantity;

            currentPriceElement.textContent = formatPrice(newPrice);
            originalPriceElement.textContent = formatPrice(newOriginalPrice);
        }

        // Nút giảm
        decreaseBtn.addEventListener('click', () => {
            const currentValue = parseInt(quantityInput.value);
            if (currentValue > 1) {
                quantityInput.value = currentValue - 1;
                updatePrice();
            }
        });

        // Nút tăng
        increaseBtn.addEventListener('click', () => {
            const currentValue = parseInt(quantityInput.value);
            quantityInput.value = currentValue + 1;
            updatePrice();
        });

        // Input trực tiếp
        quantityInput.addEventListener('input', () => {
            let value = parseInt(quantityInput.value);
            const min = parseInt(quantityInput.min) || 1;

            if (isNaN(value) || value < min) {
                quantityInput.value = min;
            }
            updatePrice();
        });

    } else {
        console.error('ElementsError: quantityInput, decreaseBtn, increaseBtn, or price elements not found');
    }
});
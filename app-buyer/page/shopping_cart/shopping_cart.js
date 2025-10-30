function formatVND(amount) {
    return amount.toLocaleString('vi-VN') + '₫';
}

// Đếm tổng số sản phẩm trong giỏ hàng
function updateTotalProducts() {
    const totalProducts = document.querySelectorAll('.product-row').length;
    const totalProductsEl = document.getElementById('total-products');
    if (totalProductsEl) {
        totalProductsEl.textContent = totalProducts;
    }
}

// Update cart summary - Cập nhật số sản phẩm đã chọn và tổng tiền
function updateCartSummary() {
    const selectedCheckboxes = document.querySelectorAll('.action-btn--checkbox.selected');
    let subtotal = 0;
    let totalQuantity = 0;

    selectedCheckboxes.forEach(checkbox => {
        const row = checkbox.closest('.product-row');
        const priceText = row.querySelector('.product__price').textContent;
        // Lấy giá từ text, loại bỏ ký tự không phải số
        const price = parseInt(priceText.replace(/[^\d]/g, ''));

        const quantity = parseInt(row.querySelector('.quantity__value').textContent);
        subtotal += price;
        totalQuantity += quantity;
    });

    // Phí vận chuyển chỉ áp dụng khi có sản phẩm được chọn
    const shipping = totalQuantity > 0 ? (subtotal > 1000000 ? 0 : (15000 * Math.floor(totalQuantity/10 + 1))) : 0;

    // Giảm giá (tạm thời = 0, có thể thay đổi sau)
    const discount = - 0;

    // Tổng tiền = Subtotal + Shipping - Discount
    const total = subtotal + shipping - discount;

    // Cập nhật giá tiền các thành phần
    document.getElementById('selected-count').textContent = selectedCheckboxes.length;
    document.getElementById('subtotal').textContent = formatVND(subtotal);
    document.getElementById('shipping').textContent = formatVND(shipping);
    document.getElementById('discount').textContent = formatVND(discount);
    document.getElementById('total').textContent = formatVND(total);
}

// Quantity buttons - Tăng giảm số lượng
document.querySelectorAll('.quantity__btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const row = this.closest('.product-row');
        const quantityEl = row.querySelector('.quantity__value');
        const decreaseBtn = row.querySelector('[data-action="decrease"]');
        let quantity = parseInt(quantityEl.textContent);

        const priceText = row.querySelector('.product__price').textContent;
        const currentPrice = parseInt(priceText.replace(/[^\d]/g, ''));
        const basePrice = Math.floor(currentPrice / quantity);

        if (this.dataset.action === 'increase') {
            quantity++;
        } else if (this.dataset.action === 'decrease' && quantity > 1) {
            quantity--;
        }

        quantityEl.textContent = quantity;
        decreaseBtn.disabled = quantity === 1;

        const totalPrice = basePrice * quantity;
        row.querySelector('.product__price').textContent = formatVND(totalPrice);

        updateCartSummary();
    });
});

// Seller checkbox - Chọn tất cả sản phẩm của seller
document.querySelectorAll('.seller-group__checkbox').forEach(sellerCheckbox => {
    sellerCheckbox.addEventListener('click', function() {
        const sellerGroup = this.closest('.seller-group');
        const isSelected = this.classList.contains('selected');

        if (!isSelected) {
            // Bỏ chọn tất cả seller khác
            document.querySelectorAll('.seller-group__checkbox').forEach(cb => {
                if (cb !== this) cb.classList.remove('selected');
            });
            document.querySelectorAll('.action-btn--checkbox').forEach(itemCb => {
                const itemSellerGroup = itemCb.closest('.seller-group');
                if (itemSellerGroup !== sellerGroup) {
                    itemCb.classList.remove('selected');
                }
            });
        }

        this.classList.toggle('selected');

        // Click tất cả sản phẩm trong seller
        const itemCheckboxes = sellerGroup.querySelectorAll('.action-btn--checkbox');
        itemCheckboxes.forEach(itemCheckbox => {
            if (this.classList.contains('selected')) {
                itemCheckbox.classList.add('selected');
            } else {
                itemCheckbox.classList.remove('selected');
            }
        });

        updateCartSummary();
    });
});

// Item checkbox - Chọn từng sản phẩm
document.querySelectorAll('.action-btn--checkbox').forEach(checkbox => {
    checkbox.addEventListener('click', function() {
        const sellerGroup = this.closest('.seller-group');
        const currentSeller = sellerGroup.dataset.seller;

        const otherSelectedItems = document.querySelectorAll('.action-btn--checkbox.selected');
        let hasOtherSellerSelected = false;

        otherSelectedItems.forEach(item => {
            const itemSeller = item.closest('.seller-group').dataset.seller;
            if (itemSeller !== currentSeller) {
                hasOtherSellerSelected = true;
            }
        });

        if (hasOtherSellerSelected && !this.classList.contains('selected')) {
            alert('Bạn chỉ có thể chọn sản phẩm từ một seller tại một thời điểm!');
            return;
        }

        this.classList.toggle('selected');

        // Check if all items selected
        const allItemCheckboxes = sellerGroup.querySelectorAll('.action-btn--checkbox');
        const selectedItemCheckboxes = sellerGroup.querySelectorAll('.action-btn--checkbox.selected');
        const sellerCheckbox = sellerGroup.querySelector('.seller-group__checkbox');

        if (allItemCheckboxes.length === selectedItemCheckboxes.length && selectedItemCheckboxes.length > 0) {
            sellerCheckbox.classList.add('selected');
        } else {
            sellerCheckbox.classList.remove('selected');
        }

        updateCartSummary();
    });
});

// Remove item - Xóa sản phẩm
document.querySelectorAll('.action-btn--remove').forEach(btn => {
    btn.addEventListener('click', function() {
        const row = this.closest('.product-row');
        const sellerGroup = this.closest('.seller-group');

        row.style.opacity = '0';
        row.style.transform = 'translateX(-20px)';
        row.style.transition = 'all 0.3s';

        setTimeout(() => {
            row.remove();

            const remainingItems = sellerGroup.querySelectorAll('.product-row');
            if (remainingItems.length === 0) {
                sellerGroup.style.opacity = '0';
                setTimeout(() => {
                    sellerGroup.remove();

                    // Check if toolbar is empty
                    const toolbar = document.querySelector('.toolbar');
                    if (toolbar && toolbar.querySelectorAll('.seller-group').length === 0) {
                        toolbar.remove();
                    }

                    updateTotalProducts();
                    updateCartSummary();
                }, 300);
            } else {
                updateTotalProducts();
                updateCartSummary();
            }
        }, 300);
    });
});

// Remove seller - Xóa tất cả sản phẩm của seller
document.querySelectorAll('.seller-group__remove').forEach(btn => {
    btn.addEventListener('click', function() {
        const sellerGroup = this.closest('.seller-group');
        const sellerName = sellerGroup.querySelector('.seller-group__name').textContent;

        if (confirm(`Bạn có chắc muốn xóa tất cả sản phẩm của "${sellerName}"?`)) {
            sellerGroup.style.opacity = '0';
            sellerGroup.style.transition = 'all 0.3s';

            setTimeout(() => {
                sellerGroup.remove();

                // Check if toolbar is empty
                const toolbar = document.querySelector('.toolbar');
                if (toolbar && toolbar.querySelectorAll('.seller-group').length === 0) {
                    toolbar.remove();
                }

                updateTotalProducts();
                updateCartSummary();
            }, 300);
        }
    });
});

// Remove all - Xóa tất cả sản phẩm
document.querySelector('.cart-items__remove-all').addEventListener('click', function() {
    if (confirm('Bạn có chắc muốn xóa tất cả sản phẩm khỏi giỏ hàng?')) {
        const toolbar = document.querySelector('.toolbar');
        if (toolbar) {
            toolbar.style.opacity = '0';
            toolbar.style.transition = 'all 0.3s';
            setTimeout(() => {
                toolbar.remove();
                updateTotalProducts();
                updateCartSummary();
            }, 300);
        }
    }
});

// Initialize - Khởi tạo
document.querySelectorAll('.product-row').forEach(row => {
    const decreaseBtn = row.querySelector('[data-action="decrease"]');
    const quantity = parseInt(row.querySelector('.quantity__value').textContent);
    if (quantity === 1) {
        decreaseBtn.disabled = true;
    }

});

// Initial updates
updateTotalProducts();
updateCartSummary();
function formatVND(amount) {
    return amount.toLocaleString('vi-VN') + '₫';
}

// Update cart summary
function updateCartSummary() {
    const selectedCheckboxes = document.querySelectorAll('.action-btn--checkbox.selected');
    let subtotal = 0;
    let count = 0;

    selectedCheckboxes.forEach(checkbox => {
        const row = checkbox.closest('.product-row');
        const basePrice = parseInt(row.dataset.basePrice);
        const quantity = parseInt(row.querySelector('.quantity__value').textContent);
        subtotal += basePrice * quantity;
        count++;
    });

    const shipping = count > 0 ? 15000 : 0;
    const total = subtotal + shipping;

    document.getElementById('selected-count').textContent = count;
    document.getElementById('subtotal').textContent = formatVND(subtotal);
    document.getElementById('total').textContent = formatVND(total);
    document.getElementById('discount').textContent = '0₫';
}

// Quantity buttons
document.querySelectorAll('.quantity__btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const row = this.closest('.product-row');
        const quantityEl = row.querySelector('.quantity__value');
        const decreaseBtn = row.querySelector('[data-action="decrease"]');
        let quantity = parseInt(quantityEl.textContent);

        if (this.dataset.action === 'increase') {
            quantity++;
        } else if (this.dataset.action === 'decrease' && quantity > 1) {
            quantity--;
        }

        quantityEl.textContent = quantity;
        decreaseBtn.disabled = quantity === 1;

        // Update price
        const basePrice = parseInt(row.dataset.basePrice);
        const totalPrice = basePrice * quantity;
        row.querySelector('.product__price').textContent = formatVND(totalPrice);

        updateCartSummary();
    });
});

// Seller checkbox
document.querySelectorAll('.seller-group__checkbox').forEach(sellerCheckbox => {
    sellerCheckbox.addEventListener('click', function() {
        const sellerGroup = this.closest('.seller-group');
        const isSelected = this.classList.contains('selected');

        if (!isSelected) {
            // Unselect all other sellers
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

        // Toggle all items in this seller
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

// Item checkbox
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

// Remove item
document.querySelectorAll('.action-btn--remove').forEach(btn => {
    btn.addEventListener('click', function() {
        const row = this.closest('.product-row');
        const sellerGroup = this.closest('.seller-group');

        row.style.opacity = '0';
        row.style.transform = 'translateX(-20px)';

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

                    updateCartSummary();
                }, 300);
            } else {
                updateCartSummary();
            }
        }, 300);
    });
});

// Remove seller
document.querySelectorAll('.seller-group__remove').forEach(btn => {
    btn.addEventListener('click', function() {
        const sellerGroup = this.closest('.seller-group');
        const sellerName = sellerGroup.querySelector('.seller-group__name').textContent;

        if (confirm(`Bạn có chắc muốn xóa tất cả sản phẩm của "${sellerName}"?`)) {
            sellerGroup.style.opacity = '0';

            setTimeout(() => {
                sellerGroup.remove();

                // Check if toolbar is empty
                const toolbar = document.querySelector('.toolbar');
                if (toolbar && toolbar.querySelectorAll('.seller-group').length === 0) {
                    toolbar.remove();
                }

                updateCartSummary();
            }, 300);
        }
    });
});

// Remove all
document.querySelector('.cart-items__remove-all').addEventListener('click', function() {
    if (confirm('Bạn có chắc muốn xóa tất cả sản phẩm khỏi giỏ hàng?')) {
        const toolbar = document.querySelector('.toolbar');
        if (toolbar) {
            toolbar.style.opacity = '0';
            setTimeout(() => {
                toolbar.remove();
                updateCartSummary();
            }, 300);
        }
    }
});

// Initialize - disable decrease buttons at quantity 1
document.querySelectorAll('.product-row').forEach(row => {
    const decreaseBtn = row.querySelector('[data-action="decrease"]');
    const quantity = parseInt(row.querySelector('.quantity__value').textContent);
    if (quantity === 1) {
        decreaseBtn.disabled = true;
    }
});

// Initial summary update
updateCartSummary();
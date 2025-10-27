// Checkbox
document.querySelectorAll('.seller-group__checkbox').forEach(sellerCheckbox => {
    sellerCheckbox.addEventListener('click', function() {
        const sellerGroup = this.closest('.seller-group');
        const isSelected = this.classList.contains('selected');

        // Nếu đang chọn seller này, bỏ chọn tất cả seller khác trước
        if (!isSelected) {
            // Bỏ chọn tất cả seller group khác
            document.querySelectorAll('.seller-group__checkbox').forEach(cb => {
                if (cb !== this) {
                    cb.classList.remove('selected');
                }
            });

            // Bỏ chọn tất cả item của seller khác
            document.querySelectorAll('.cart-item__checkbox').forEach(itemCb => {
                const itemSellerGroup = itemCb.closest('.seller-group');
                if (itemSellerGroup !== sellerGroup) {
                    itemCb.classList.remove('selected');
                }
            });
        }

        // Toggle seller checkbox
        this.classList.toggle('selected');

        // Chọn/bỏ chọn tất cả items trong seller group này
        const itemCheckboxes = sellerGroup.querySelectorAll('.cart-item__checkbox');
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

// Xử lý checkbox của từng item
document.querySelectorAll('.cart-item__checkbox').forEach(checkbox => {
    checkbox.addEventListener('click', function() {
        const sellerGroup = this.closest('.seller-group');
        const currentSeller = sellerGroup.dataset.seller;

        // Kiểm tra xem có item nào của seller khác đang được chọn không
        const otherSelectedItems = document.querySelectorAll('.cart-item__checkbox.selected');
        let hasOtherSellerSelected = false;

        otherSelectedItems.forEach(item => {
            const itemSeller = item.closest('.seller-group').dataset.seller;
            if (itemSeller !== currentSeller) {
                hasOtherSellerSelected = true;
            }
        });

        // Nếu có item của seller khác đang được chọn, không cho phép chọn
        if (hasOtherSellerSelected && !this.classList.contains('selected')) {
            alert('Bạn chỉ có thể chọn sản phẩm từ một seller tại một thời điểm!');
            return;
        }

        // Toggle item checkbox
        this.classList.toggle('selected');

        // Kiểm tra xem tất cả items của seller có được chọn không
        const allItemCheckboxes = sellerGroup.querySelectorAll('.cart-item__checkbox');
        const selectedItemCheckboxes = sellerGroup.querySelectorAll('.cart-item__checkbox.selected');
        const sellerCheckbox = sellerGroup.querySelector('.seller-group__checkbox');

        if (allItemCheckboxes.length === selectedItemCheckboxes.length && selectedItemCheckboxes.length > 0) {
            sellerCheckbox.classList.add('selected');
        } else {
            sellerCheckbox.classList.remove('selected');
        }

        updateCartSummary();
    });
});

//Xóa sản phẩm, nêếu hết sản phẩm seller thì xóa seller luôn
document.querySelectorAll('.cart-item__remove').forEach(btn => {
btn.addEventListener('click', function() {
const cartItem = this.closest('.cart-item');
const sellerGroup = this.closest('.seller-group');

cartItem.style.opacity = '0';
cartItem.style.transform = 'translateX(-20px)';

setTimeout(() => {
    cartItem.remove();

    // Kiểm tra nếu seller group không còn item nào thì xóa luôn seller group
    const remainingItems = sellerGroup.querySelectorAll('.cart-item');
    if (remainingItems.length === 0) {
        sellerGroup.style.opacity = '0';
        sellerGroup.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            sellerGroup.remove();
            updateCartSummary();
        }, 300);
    } else {
        updateCartSummary();
    }
}, 300);
});
});

//Xóa Seller
document.querySelectorAll('.seller-group__remove').forEach(btn => {
    btn.addEventListener('click', function() {
        const sellerGroup = this.closest('.seller-group');
        const sellerName = sellerGroup.querySelector('.seller-group__name').textContent;

        if (confirm(`Bạn có chắc muốn xóa tất cả sản phẩm của "${sellerName}" khỏi giỏ hàng?`)) {
            sellerGroup.style.opacity = '0';
            sellerGroup.style.transform = 'translateY(-10px)';

            setTimeout(() => {
                sellerGroup.remove();
                updateCartSummary();
            }, 300);
        }
    });
});

//Xóa hết giỏ hàng
const removeAllButton = document.querySelector('.cart-items__remove-all');
if (removeAllButton) {
    removeAllButton.addEventListener('click', function() {
        if (confirm('Bạn có chắc muốn xóa tất cả sản phẩm khỏi giỏ hàng?')) {
            const sellerGroups = document.querySelectorAll('.seller-group');

            sellerGroups.forEach((group, index) => {
                setTimeout(() => {
                    group.style.opacity = '0';
                    group.style.transform = 'translateY(-10px)';

                    setTimeout(() => {
                        group.remove();
                        if (index === sellerGroups.length - 1) {
                            updateCartSummary();
                        }
                    }, 300);
                }, index * 100);
            });
        }
    });
}



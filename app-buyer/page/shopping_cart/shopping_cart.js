//Xóa hàng
document.querySelectorAll('.cart-item__remove').forEach(btn => {
    btn.addEventListener('click', function() {
        if(confirm('Remove this item from cart?')) {
            this.closest('.cart-item').remove();
            updateCartCount();
        }
    });
});

// Xóa hết giỏ hàng
document.querySelector('.cart-items__remove-all').addEventListener('click', function() {
    if(confirm('Remove all items from cart?')) {
        document.querySelectorAll('.cart-item').forEach(item => item.remove());
        updateCartCount();
    }
});
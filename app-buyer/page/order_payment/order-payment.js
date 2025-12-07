// Chọn cách thanh toán
const paymentOptions = document.querySelectorAll('.payment-option');
paymentOptions.forEach(option => {
    option.addEventListener('click', function() {
        paymentOptions.forEach(opt => opt.classList.remove('active'));
        this.classList.add('active');
    });
});
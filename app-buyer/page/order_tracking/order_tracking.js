// Dữ liệu đơn hàng
const orders = [
    {
        id: 1,
        status: 'pending',
        store: { name: 'TechStore VN' },
        product: {
            name: 'Điện thoại Samsung Galaxy S24 Ultra 256GB',
            variant: 'Phân loại hàng: Màu Đen',
            quantity: 1,
            image: '../../accets/product-interior/review-2.png'
        },
        price: { original: '30.990.000₫', final: '27.990.000₫' },
        statusInfo: { icon: '⏳', text: 'Chờ xác nhận', label: '', color: 'var(--orange-600)' }
    },
    {
        id: 2,
        status: 'shipping',
        store: { name: 'FashionHub' },
        product: {
            name: 'Áo Thun Nam Basic Cotton Cao Cấp',
            variant: 'Phân loại hàng: Size L, Màu Trắng',
            quantity: 2,
            image: '../../accets/product-interior/review-1.png'
        },
        price: { original: '350.000₫', final: '280.000₫' },
        statusInfo: { icon: '🚚', text: 'Đang vận chuyển', label: '', color: 'var(--blue-600)' }
    },
    {
        id: 3,
        status: 'delivering',
        store: { name: 'HomeDecor Store' },
        product: {
            name: 'Đèn LED Trang Trí Phòng Ngủ RGB',
            variant: 'Phân loại hàng: 5m',
            quantity: 1,
            image: '../../accets/product-interior/review-3.png'
        },
        price: { original: '450.000₫', final: '320.000₫' },
        statusInfo: { icon: '📦', text: '', label: 'ĐANG GIAO', color: 'var(--blue-600)' }
    },
    {
        id: 4,
        status: 'completed',
        store: { name: 'giadungmax' },
        product: {
            name: 'Túi Vải Bạt Dựng Đỡ Siêu To Chống Ẩm Mốc, Chống Thấm Nước',
            variant: 'Phân loại hàng: Đai 80*20*60cm',
            quantity: 1,
            image: '../../accets/product-interior/review-4.png'
        },
        price: { original: '76.400₫', final: '38.200₫' },
        statusInfo: { icon: '✅', text: '', label: 'HOÀN THÀNH', color: 'var(--green-600)' }
    },
    {
        id: 5,
        status: 'completed',
        store: { name: 'Hoco.HN' },
        product: {
            name: 'Tai Nghe Có Dây Hoco Chính hãng, Dây dài 1m2',
            variant: 'Phân loại hàng: Trắng',
            quantity: 1,
            image: '../../accets/product-interior/review-5.png'
        },
        price: { original: '90.000₫', final: '32.000₫' },
        statusInfo: { icon: '✅', text: '', label: 'HOÀN THÀNH', color: 'var(--green-600)' }
    },
    {
        id: 6,
        status: 'cancelled',
        store: { name: 'BookStore VN' },
        product: {
            name: 'Combo 5 Cuốn Sách Kinh Tế Hay Nhất 2024',
            variant: 'Phân loại hàng: Bìa mềm',
            quantity: 1,
            image: '../../accets/product-interior/review-2.png'
        },
        price: { original: '500.000₫', final: '380.000₫' },
        statusInfo: { icon: '', text: '', label: 'ĐÃ HỦY', color: 'var(--red-600)' }
    },
    {
        id: 7,
        status: 'refund',
        store: { name: 'ElectroShop' },
        product: {
            name: 'Chuột Gaming RGB DPI Cao',
            variant: 'Phân loại hàng: Màu Đen',
            quantity: 1,
            image: '../../accets/product-interior/review-3.png'
        },
        price: { original: '650.000₫', final: '490.000₫' },
        statusInfo: { icon: '↩️', text: 'Đang xử lý hoàn tiền', label: '', color: 'var(--orange-600)' }
    }
];

// Thực thi
function renderOrders(status = 'all') {
    const container = document.getElementById('ordersContainer');
    const emptyState = document.getElementById('emptyState');

    // Filter orders
    const filteredOrders = status === 'all'
        ? orders
        : orders.filter(order => order.status === status);

    // Clear container
    container.innerHTML = '';

    if (filteredOrders.length === 0) {
        emptyState.classList.add('show');
        return;
    } else {
        emptyState.classList.remove('show');
    }

    // Thực thi với mỗi loại đơn mua
    filteredOrders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card show';
        orderCard.innerHTML = `
            <div class="order-header">
                <div class="store-info">
                    <span class="store-name">${order.store.name}</span>
                    <button class="chat-button">💬 Chat</button>
                    <a href="#" style="color: var(--neutral-600); text-decoration: none;">👁️ Xem Shop</a>
                </div>
                <div class="order-status">
                    <span class="status-icon">${order.statusInfo.icon}</span>
                    <span class="status-text" style="color: ${order.statusInfo.color}">
                        ${order.statusInfo.text}
                    </span>
                    <span class="order-complete" style="color: ${order.statusInfo.color}">
                        ${order.statusInfo.label}
                    </span>
                </div>
            </div>

            <div class="order-body">
                <div class="product-item">
                    <div class="product-image"><img src="${order.product.image}" alt="${order.product.name}" style="width: 100%; height: 100%; object-fit: cover;"></div>
                    <div class="product-info">
                        <div class="product-name">${order.product.name}</div>
                        <div class="product-variant">${order.product.variant}</div>
                        <div class="product-quantity">x${order.product.quantity}</div>
                    </div>
                    <div class="product-price">
                        <div class="price-original">${order.price.original}</div>
                        <div class="price-final">${order.price.final}</div>
                    </div>
                </div>
            </div>

            <div class="order-total">
                <span class="total-label">Thành tiền:</span>
                <span class="total-amount">${order.price.final}</span>
            </div>

            <div class="order-actions">
                ${order.status === 'completed' ?
                    `<button class="btn btn-primary">Mua Lại</button>
                     <button class="btn">Đánh Giá</button>` :
                  order.status === 'pending' ?
                    `<button class="btn">Hủy Đơn</button>` :
                  order.status === 'shipping' || order.status === 'delivering' ?
                    `<button class="btn btn-primary">Xem Chi Tiết</button>` :
                  order.status === 'cancelled' ?
                    `<button class="btn btn-primary">Mua Lại</button>` :
                    `<button class="btn">Xem Chi Tiết</button>`
                }
                <button class="btn">Liên Hệ Người Bán</button>
            </div>
        `;
        container.appendChild(orderCard);
    });
}

// Chuyển đổi giữa các loại đơn mua
const tabs = document.querySelectorAll('.tab');
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active class from all tabs
        tabs.forEach(t => t.classList.remove('active'));

        // Add active class to clicked tab
        tab.classList.add('active');

        // Get status and render orders
        const status = tab.dataset.status;
        renderOrders(status);
    });
});

// Initial render
renderOrders('all');

// Tìm kiếm đơn hàng theo thông tin đơn (tên shop/ tên hàng/...)
const searchInput = document.querySelector('.search-bar__input');
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const orderCards = document.querySelectorAll('.order-card');

    orderCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
});
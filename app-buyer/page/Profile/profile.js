function toggleSubmenu(e) {
    e.preventDefault();
    const submenu = e.currentTarget.nextElementSibling;
    if (submenu && submenu.classList.contains('submenu')) {
        submenu.classList.toggle('show');
    }
}

function showSection(e, sectionId) {
    e.preventDefault();

    // Remove active class from all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Remove active class from all submenu links
    document.querySelectorAll('.submenu__link').forEach(link => {
        link.classList.remove('active');
    });

    // Add active class to clicked section and link
    document.getElementById(sectionId).classList.add('active');
    e.currentTarget.classList.add('active');
}

function previewAvatar(e) {
    const file = e.target.files[0];
    if (file) {
        // Check file size (1MB = 1048576 bytes)
        if (file.size > 1048576) {
            alert('Dung lượng file vượt quá 1 MB');
            return;
        }

        // Check file type
        if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
            alert('Chỉ chấp nhận file JPEG hoặc PNG');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            const img = document.getElementById('avatarImg');
            const placeholder = document.getElementById('avatarPlaceholder');
            img.src = event.target.result;
            img.style.display = 'block';
            placeholder.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
}
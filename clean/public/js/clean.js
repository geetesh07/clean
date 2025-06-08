// Theme Toggle
function toggleTheme() {
    const root = document.documentElement;
    const currentTheme = root.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// Sidebar Management
function setupSidebar() {
    const sidebar = document.querySelector('.desk-sidebar');
    const content = document.querySelector('.page-container');
    
    // Toggle Sidebar Collapse
    function toggleSidebar() {
        sidebar.classList.toggle('collapsed');
        content.style.marginLeft = sidebar.classList.contains('collapsed') ? '0' : '220px';
        localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
    }
    
    // Responsive Handling
    function handleResponsive() {
        if (window.innerWidth < 768) {
            sidebar.classList.add('mobile-collapsed');
            content.style.marginLeft = '0';
        } else {
            sidebar.classList.remove('mobile-collapsed');
            content.style.marginLeft = '220px';
        }
    }

    // Event Listeners
    window.addEventListener('resize', handleResponsive);
    document.querySelectorAll('.sidebar-toggle').forEach(btn => {
        btn.addEventListener('click', toggleSidebar);
    });

    // Initialize
    handleResponsive();
    if (localStorage.getItem('sidebarCollapsed') === 'true') toggleSidebar();
}

// Active Link Management
function setActiveLinks() {
    document.querySelectorAll('.desk-sidebar-item').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.desk-sidebar-item').forEach(i => i.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
}

// Form Enhancements
function enhanceForms() {
    document.querySelectorAll('.form-control').forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });
        input.addEventListener('blur', () => {
            input.parentElement.classList.remove('focused');
        });
    });
}

// Initialize Everything
document.addEventListener('DOMContentLoaded', () => {
    // Set initial theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Initialize components
    setupSidebar();
    setActiveLinks();
    enhanceForms();

    // Theme toggle button
    document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
});

// Mobile Menu Toggle
function setupMobileMenu() {
    const menuToggle = document.createElement('div');
    menuToggle.className = 'mobile-menu-toggle';
    menuToggle.innerHTML = '☰';
    document.body.appendChild(menuToggle);

    menuToggle.addEventListener('click', () => {
        const sidebar = document.querySelector('.desk-sidebar');
        sidebar.classList.toggle('show-mobile');
    });
}

// Optional: Login Page Enhancements
function enhanceLoginPage() {
    if (document.querySelector('[data-path="login"]')) {
        const container = document.createElement('div');
        container.className = 'login-animation-container';
        document.querySelector('#page-login').prepend(container);
    }
}

// ==== CLEAN.JS (PATCHED FOR DYNAMIC DARK MODE CONSISTENCY AND COMPONENT HOOKING) ====

(function () {
    // Ensure DOM fully loads
    document.addEventListener('DOMContentLoaded', function () {
      const body = document.body;
  
      // Utility: Force apply dark class if dark mode is active
      function applyDarkModeFixes() {
        if (body.getAttribute('data-theme') === 'dark') {
          document.querySelectorAll('.form-control, input, textarea, select').forEach(el => {
            el.style.backgroundColor = '#1f1f1f';
            el.style.color = '#f0f0f0';
            el.style.borderColor = '#3c3c3e';
          });
        }
      }
  
      // Observe theme switch
      const observer = new MutationObserver(mutations => {
        for (let mutation of mutations) {
          if (mutation.attributeName === 'data-theme') {
            applyDarkModeFixes();
          }
        }
      });
      observer.observe(body, { attributes: true });
  
      // Initial call
      applyDarkModeFixes();
  
      // Patch for Awesomplete dropdowns
      const fixDropdownStyle = () => {
        document.querySelectorAll('[role="listbox"]').forEach(listbox => {
          listbox.style.borderRadius = '8px';
          listbox.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
          if (body.getAttribute('data-theme') === 'dark') {
            listbox.style.backgroundColor = '#2c2c2e';
            listbox.style.borderColor = '#444';
          }
        });
      };
  
      // Use MutationObserver for dropdowns as they are dynamically created
      const dropdownObserver = new MutationObserver(fixDropdownStyle);
      dropdownObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
  
    });
  });
  
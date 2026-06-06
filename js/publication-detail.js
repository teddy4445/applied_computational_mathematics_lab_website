document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.js-copy-publication-citation').forEach((button) => {
    button.addEventListener('click', async () => {
      const citation = button.getAttribute('data-citation') || '';

      try {
        await navigator.clipboard.writeText(citation);
        const original = button.innerHTML;
        button.innerHTML = '<i class="ri-check-line"></i><span>Copied</span>';
        setTimeout(() => {
          button.innerHTML = original;
        }, 1500);
      } catch (error) {
        alert(citation || 'Citation unavailable');
      }
    });
  });
});

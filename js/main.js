
tailwind.config = {
theme: {
extend: {
colors: {
primary: '#2563eb',
secondary: '#f43f5e'
},
borderRadius: {
'none': '0px',
'sm': '4px',
DEFAULT: '8px',
'md': '12px',
'lg': '16px',
'xl': '20px',
'2xl': '24px',
'3xl': '32px',
'full': '9999px',
'button': '8px'
}
}
}
}

document.addEventListener('DOMContentLoaded', function () {
  const navLinks = document.querySelectorAll('.nav-link');

  navLinks.forEach(link => {
    if (window.location.pathname.includes(link.getAttribute('href'))) {
      link.classList.add('text-primary', 'bg-white', 'shadow-sm');
    }
  });
});

document.addEventListener('DOMContentLoaded', function () {
  const abstractToggles = document.querySelectorAll('.abstract-toggle');
  abstractToggles.forEach(toggle => {
    toggle.addEventListener('click', function () {
      const content = this.parentElement.querySelector('.abstract-content');
      const icon = this.querySelector('i');
      const text = this.querySelector('span');
      if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        icon.classList.add('rotate-180');
        text.textContent = 'Hide Abstract';
      } else {
        content.classList.add('hidden');
        icon.classList.remove('rotate-180');
        text.textContent = 'Show Abstract';
      }
    });
  });

  const yearFilter = document.getElementById('year-filter');
  const categoryFilter = document.getElementById('category-filter');
  const searchInput = document.getElementById('search-input');
  const sortFilter = document.getElementById('sort-filter');
  const publicationsContainer = document.getElementById('publications-container');

  function filterAndSortPublications() {
    const cards = Array.from(document.querySelectorAll('.publication-card'));
    const yearValue = yearFilter.value;
    const categoryValue = categoryFilter.value;
    const searchValue = searchInput.value.toLowerCase();
    const sortValue = sortFilter.value;

    let filteredCards = cards.filter(card => {
      const year = card.getAttribute('data-year');
      const category = card.getAttribute('data-category');
      const title = card.querySelector('h3').textContent.toLowerCase();
      const authors = card.querySelector('p').textContent.toLowerCase();
      const yearMatch = !yearValue || year === yearValue;
      const categoryMatch = !categoryValue || category === categoryValue;
      const searchMatch = !searchValue || title.includes(searchValue) || authors.includes(searchValue);
      return yearMatch && categoryMatch && searchMatch;
    });

    filteredCards.sort((a, b) => {
      const titleA = a.querySelector('h3').textContent;
      const titleB = b.querySelector('h3').textContent;
      const yearA = parseInt(a.getAttribute('data-year'));
      const yearB = parseInt(b.getAttribute('data-year'));
      switch (sortValue) {
        case 'date-asc': return yearA - yearB;
        case 'date-desc': return yearB - yearA;
        case 'title': return titleA.localeCompare(titleB);
        default: return yearB - yearA;
      }
    });

    publicationsContainer.innerHTML = '';
    filteredCards.forEach(card => publicationsContainer.appendChild(card));
  }

  [yearFilter, categoryFilter, searchInput, sortFilter].forEach(element => {
    if (element) {
      element.addEventListener('change', filterAndSortPublications);
      element.addEventListener('input', filterAndSortPublications);
    }
  });
});

// Navbar background on scroll
window.addEventListener("scroll", () => {
  const nav = document.getElementById("navbar");
  if (window.scrollY > 20) {
	nav.classList.add("nav-scrolled");
  } else {
	nav.classList.remove("nav-scrolled");
  }
});


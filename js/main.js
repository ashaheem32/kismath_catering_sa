/* =========================================================
   KISMATH — Main JS
   Navbar, mobile menu, Swiper carousels, lightbox.
   ========================================================= */

(() => {
  'use strict';

  // Footer year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile hamburger
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', open);
    });
    navLinks.querySelectorAll('a').forEach(link =>
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        hamburger.setAttribute('aria-expanded', false);
      })
    );
  }

  // Swiper — Testimonials
  if (window.Swiper && document.querySelector('.testimonialsSwiper')) {
    new Swiper('.testimonialsSwiper', {
      slidesPerView: 1,
      loop: true,
      pagination: { el: '.testimonialsSwiper .swiper-pagination', clickable: true },
    });
  }

  // -------------------------------------------------------
  // Menu modal — clicking a category card opens its dishes
  // -------------------------------------------------------
  const MENU_DATA = {
    healthy: {
      title: 'Healthy Meals',
      ar: 'وجبات صحية',
      dishes: [
        { name: 'Ceasar Salad',                img: 'images/menu/ceasar_salad.jpg' },
        { name: 'Kehl Salad',                  img: 'images/menu/kehl_salad.jpg' },
        { name: 'Fatoush Salad',               img: 'images/menu/fatoush_salad.jpg' },
        { name: 'High Protein Chicken Salad',  img: 'images/menu/high_protein_chicken_salad.jpg' },
        { name: 'Greek Salad',                 img: 'images/menu/greek_salad.jpg' },
      ],
    },
    soups: {
      title: 'Soups',
      ar: 'شوربات',
      dishes: [
        { name: 'Pumpkin Soup',         img: 'images/menu/pumpkin_soup.jpg' },
        { name: 'Lentil Soup',          img: 'images/menu/lentil_soup.jpg' },
        { name: 'Bone Broth',           img: 'images/menu/bone_broth.jpg' },
        { name: 'Creamy Brocoli Soup',  img: 'images/menu/creamy_brocoli_soup.jpg' },
        { name: 'Mushroom Soup',        img: 'images/menu/mushroom_soup.jpg' },
        { name: 'Creamy Chicken Soup',  img: 'images/menu/creamy_chicken_soup.jpg' },
      ],
    },
    main: {
      title: 'Main Course',
      ar: 'الأطباق الرئيسية',
      dishes: [
        { name: 'Mashkool Rice',         img: 'images/menu/mashkool_rice.jpg' },
        { name: 'Chicken Biriyani',      img: 'images/menu/chicken_biriyani.jpg' },
        { name: 'Beef Biriyani',         img: 'images/menu/beef_biriyani.jpg' },
        { name: 'Mutton Biriyani',       img: 'images/menu/mutton_biriyani.jpg' },
        { name: 'Prawns Biriyani',       img: 'images/menu/prawns_biriyani.jpg' },
        { name: 'Fish Biriyani',         img: 'images/menu/fish_biriyani.jpg' },
        { name: 'Mutton Fry',            img: 'images/menu/mutton_fry_kerala_nadan.jpg' },
        { name: 'Beef Fry',              img: 'images/menu/beef_fry_kerala_ularthiyathu.jpg' },
        { name: 'Pinky Rigatoni Pasta',  img: 'images/menu/pinky_rigatoni_pasta.jpg' },
        { name: 'Spaghetti Bolognese',   img: 'images/menu/spaghetti_bolognese.jpg' },
        { name: 'Penne Pasta',           img: 'images/menu/penne_pasta.jpg' },
        { name: 'Alfredo Pasta',         img: 'images/menu/alfredo_pasta.jpg' },
        { name: 'Herbal Chicken',        img: 'images/menu/herbal_chicken.jpg' },
        { name: 'Steaks',                img: 'images/menu/steaks.jpg' },
      ],
    },
    grills: {
      title: 'Grills',
      ar: 'المشويات',
      dishes: [
        { name: 'Kebabs (Chicken)',    img: 'images/menu/chicken_kebabs.jpg' },
        { name: 'Tandoori Shrimps',    img: 'images/menu/tandoori_shrimps.jpg' },
        { name: 'Tandoori Fish',       img: 'images/menu/tandoori_fish.jpg' },
        { name: 'Mutton Liver Kebab',  img: 'images/menu/mutton_liver_kebab.jpg' },
      ],
    },
    beverages: {
      title: 'Beverages',
      ar: 'شاي، قهوة وعصائر',
      dishes: [
        { name: 'Green Tea',                  img: 'images/menu/green_tea.jpg' },
        { name: 'Herbal Tea (Viola Sororia)', img: 'images/menu/herbal_tea.jpg' },
        { name: 'Coffee',                     img: 'images/menu/coffee.jpg' },
        { name: 'Black Coffee',               img: 'images/menu/black_coffee.jpg' },
        { name: 'Karak Tea',                  img: 'images/menu/karak_tea.jpg' },
        { name: 'Lemon Tea',                  img: 'images/menu/lemon_tea.jpg' },
        { name: 'Avocado Honey',              img: 'images/menu/avocado_honey.jpg' },
        { name: 'ABC Juice',                  img: 'images/menu/abc_juice.jpg' },
        { name: 'Orange',                     img: 'images/menu/orange_juice.jpg' },
        { name: 'Mint Lime',                  img: 'images/menu/mint_lime.jpg' },
        { name: 'Guava',                      img: 'images/menu/guava_juice.jpg' },
        { name: 'Apple',                      img: 'images/menu/apple_juice.jpg' },
        { name: 'Sweet Melon',                img: 'images/menu/sweet_melon_juice.jpg' },
        { name: 'Watermelon',                 img: 'images/menu/watermelon_juice.jpg' },
      ],
    },
    snacks: {
      title: 'Snacks',
      ar: 'المقبلات',
      dishes: [
        { name: 'Popcorns',            img: 'images/menu/popcorns.jpg' },
        { name: 'Veggies and Hummus',  img: 'images/menu/veggies_hummus.jpg' },
        { name: 'Fruits and Berries',  img: 'images/menu/fruits_berries.jpg' },
        { name: 'Tiny Burger',         img: 'images/menu/tiny_burger.jpg' },
        { name: 'Chenna Fatak',        img: 'images/menu/chenna_fatak.jpg' },
      ],
    },
  };

  const menuModal = document.getElementById('menuModal');
  if (menuModal) {
    const modalTitle  = menuModal.querySelector('.menu-modal-title');
    const modalAr     = menuModal.querySelector('.menu-modal-ar');
    const dishGrid    = menuModal.querySelector('#dishGrid');
    const modalClose  = menuModal.querySelector('.menu-modal-close');
    const modalBack   = menuModal.querySelector('.menu-modal-backdrop');

    const openMenu = (key) => {
      const data = MENU_DATA[key];
      if (!data) return;
      modalTitle.textContent = data.title;
      modalAr.textContent    = data.ar;
      dishGrid.innerHTML = data.dishes.map(d => `
        <article class="dish-card">
          <div class="dish-img"><img loading="lazy" src="${d.img}" alt="${d.name}" /></div>
          <div class="dish-body">
            <h3 class="dish-name">${d.name}</h3>
            ${d.desc ? `<p class="dish-desc">${d.desc}</p>` : ''}
          </div>
        </article>
      `).join('');
      menuModal.classList.add('active');
      menuModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };
    const closeMenu = () => {
      menuModal.classList.remove('active');
      menuModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };

    document.querySelectorAll('.menu-card[data-category]').forEach(card => {
      const key = card.dataset.category;
      card.addEventListener('click', () => openMenu(key));
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openMenu(key); }
      });
    });

    modalClose.addEventListener('click', closeMenu);
    modalBack.addEventListener('click', closeMenu);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && menuModal.classList.contains('active')) closeMenu();
    });
  }

  // -------------------------------------------------------
  // Contact form — POST as JSON to /api/contact (Vercel function)
  // -------------------------------------------------------
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    const status = contactForm.querySelector('.form-status');
    const submit = contactForm.querySelector('button[type="submit"]');
    const submitDefault = submit ? submit.textContent : 'Send Inquiry';

    const setStatus = (msg, kind) => {
      if (!status) return;
      status.textContent = msg;
      status.className = 'form-status show ' + (kind || '');
    };

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }
      submit.disabled = true;
      submit.textContent = 'Sending…';
      setStatus('', '');

      const payload = Object.fromEntries(new FormData(contactForm).entries());

      try {
        const res = await fetch(contactForm.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          setStatus('Thank you — your inquiry is on its way. We will be in touch shortly.', 'success');
          contactForm.reset();
        } else {
          setStatus(data.error || 'Something went wrong. Please try WhatsApp.', 'error');
        }
      } catch (err) {
        setStatus('Network error. Please check your connection or try WhatsApp.', 'error');
      } finally {
        submit.disabled = false;
        submit.textContent = submitDefault;
      }
    });
  }

  // Gallery lightbox
  const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
  const lightbox = document.getElementById('lightbox');
  if (lightbox && galleryItems.length) {
    const lbImg = lightbox.querySelector('img');
    const lbClose = lightbox.querySelector('.lb-close');
    const lbPrev = lightbox.querySelector('.lb-prev');
    const lbNext = lightbox.querySelector('.lb-next');
    let lbIndex = 0;

    const openLB = (idx) => {
      lbIndex = idx;
      lbImg.src = galleryItems[idx].href;
      lbImg.alt = galleryItems[idx].querySelector('img').alt || '';
      lightbox.classList.add('active');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };
    const closeLB = () => {
      lightbox.classList.remove('active');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };
    const stepLB = (dir) => {
      lbIndex = (lbIndex + dir + galleryItems.length) % galleryItems.length;
      lbImg.src = galleryItems[lbIndex].href;
      lbImg.alt = galleryItems[lbIndex].querySelector('img').alt || '';
    };

    galleryItems.forEach((a, i) => {
      a.addEventListener('click', e => {
        e.preventDefault();
        openLB(i);
      });
    });
    lbClose.addEventListener('click', closeLB);
    lbPrev.addEventListener('click', () => stepLB(-1));
    lbNext.addEventListener('click', () => stepLB(1));
    lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLB(); });
    document.addEventListener('keydown', e => {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') closeLB();
      if (e.key === 'ArrowRight') stepLB(1);
      if (e.key === 'ArrowLeft') stepLB(-1);
    });
  }
})();

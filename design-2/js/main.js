(() => {
  'use strict';
  const productImage = id => document.querySelector(`[data-view="${id}"] img`).src;
  const firstHeroImage = document.querySelector('[data-hero-image]').src;
  const products = {
    blue: {name:'The Blue Halo',category:'Halo rings',image:productImage('blue'),className:'blue',description:'An ice-blue centre surrounded by a luminous halo. A closer look at colour, light, and the details that make a piece feel personal.'},
    green: {name:'The Green Halo',category:'Colour gemstones',image:productImage('green'),className:'green',description:'A vivid green oval centre, framed by a delicate halo and a stone-set band. A distinctive expression of colour.'},
    signet: {name:'The Midnight Signet',category:'Statement rings',image:productImage('signet'),className:'signet',description:'A sculptural silver-toned silhouette, a deep blue accent, and intricate detailing. A statement seen from every angle.'},
    necklace: {name:'The Everyday Solitaire',category:'Necklaces',image:productImage('necklace'),className:'necklace',description:'A fine golden chain with a single luminous centre. Understated jewellery for the moments that become your own.'}
  };
  const isDark = document.body.classList.contains('dark');
  const slides = [
    {image:firstHeroImage,alt:'Ice-blue oval halo ring nestled in sculptural teal silk',title:isDark?'A world within<br>a stone.':'Rare by<br>nature.',sub:isDark?'Exceptional colour. Enduring fascination.':'Yours by choice.',id:'blue'},
    {image:products.green.image,alt:'Green oval halo ring on a reflective black surface',title:isDark?'Colour beyond<br>the ordinary.':'Colour that<br>captivates.',sub:isDark?'A different expression of you.':'An instinct for the extraordinary.',id:'green'},
    {image:products.signet.image,alt:'Silver-toned statement ring with a deep blue centre stone',title:isDark?'A signature<br>all your own.':'Distinctly<br>your own.',sub:isDark?'Character, in every detail.':'A new perspective on timeless.',id:'signet'}
  ];
  let current = 0;
  const heroImage = document.querySelector('[data-hero-image]');
  const heroTitle = document.querySelector('[data-hero-title]');
  const heroSub = document.querySelector('[data-hero-sub]');
  const slideStatus = document.querySelector('[data-slide-status]');
  function showSlide(index) {
    current = (index + slides.length) % slides.length;
    const slide = slides[current];
    heroImage.src = slide.image;
    heroImage.alt = slide.alt;
    heroImage.style.objectFit = current === 0 ? 'cover' : 'contain';
    heroImage.style.backgroundColor = current === 0 ? '' : '#000';
    heroImage.className = current === 2 ? 'signet-slide' : '';
    heroImage.parentElement.classList.toggle('is-product',current !== 0);
    heroTitle.innerHTML = slide.title;
    heroSub.textContent = slide.sub;
    document.querySelectorAll('[data-counter]').forEach(el => el.textContent = `0${current + 1} / 03`);
    document.querySelectorAll('[data-slide]').forEach(el => el.setAttribute('aria-pressed', String(Number(el.dataset.slide) === current)));
    if (slideStatus) slideStatus.textContent = `Piece ${current + 1} of 3: ${products[slide.id].name}`;
  }
  document.querySelector('[data-next]').addEventListener('click', () => showSlide(current + 1));
  document.querySelector('[data-prev]').addEventListener('click', () => showSlide(current - 1));
  document.querySelectorAll('[data-slide]').forEach(el => el.addEventListener('click', () => showSlide(Number(el.dataset.slide))));
  const hero = document.querySelector('.hero');
  hero.addEventListener('keydown', event => {
    if (event.target.matches('input,select,textarea')) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); showSlide(current + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); showSlide(current - 1); }
  });
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach(el => el.setAttribute('aria-pressed', String(el === button)));
    let count = 0;
    document.querySelectorAll('[data-product]').forEach(product => {
      const show = button.dataset.filter === 'all' || product.dataset.category === button.dataset.filter;
      product.hidden = !show;
      if (show) count++;
    });
    document.querySelector('[data-filter-status]').textContent = `${count} ${count === 1 ? 'piece' : 'pieces'} shown`;
  }));
  let lastFocus;
  function openModal(modal) {
    lastFocus = document.activeElement;
    modal.showModal();
    document.body.classList.add('has-modal');
  }
  document.querySelectorAll('dialog').forEach(modal => {
    modal.addEventListener('close', () => {
      if (!document.querySelector('dialog[open]')) document.body.classList.remove('has-modal');
      if (lastFocus && document.contains(lastFocus)) lastFocus.focus({preventScroll:true});
    });
    modal.addEventListener('click', event => {
      if (event.target !== modal) return;
      const rect = modal.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) modal.close();
    });
  });
  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
  const productModal = document.querySelector('#product-dialog');
  function showProduct(id) {
    const product = products[id];
    const image = productModal.querySelector('img');
    image.src = product.image;
    image.alt = product.name;
    image.className = product.className;
    productModal.querySelector('h2').textContent = product.name;
    productModal.querySelector('[data-detail-category]').textContent = product.category;
    productModal.querySelector('[data-detail-description]').textContent = product.description;
    productModal.querySelector('[data-enquire-piece]').dataset.piece = product.name;
    openModal(productModal);
  }
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => showProduct(button.dataset.view)));
  document.querySelectorAll('[data-view-current]').forEach(button => button.addEventListener('click', () => showProduct(slides[current].id)));
  const booking = document.querySelector('#appointment-dialog');
  document.querySelectorAll('[data-appointment]').forEach(button => button.addEventListener('click', () => {
    const piece = button.dataset.piece || 'A private viewing';
    if (productModal.open) productModal.close();
    booking.querySelector('[name=interest]').value = piece;
    booking.querySelector('[data-result]').textContent = '';
    openModal(booking);
  }));
  booking.querySelector('form').addEventListener('submit', event => {
    event.preventDefault();
    const result = booking.querySelector('[data-result]');
    result.textContent = 'Preview complete. No request was sent and your details have not been saved.';
    result.focus();
  });
  const menu = document.querySelector('#menu-dialog');
  document.querySelectorAll('[data-menu]').forEach(button => button.addEventListener('click', () => openModal(menu)));
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => menu.close()));
})();

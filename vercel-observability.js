(() => {
  window.va = window.va || function () {
    (window.vaq = window.vaq || []).push(arguments);
  };

  window.si = window.si || function () {
    (window.siq = window.siq || []).push(arguments);
  };

  const scripts = [
    '/_vercel/insights/script.js',
    '/_vercel/speed-insights/script.js',
  ];

  scripts.forEach((src) => {
    if (document.querySelector(`script[src="${src}"]`)) return;

    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    document.head.appendChild(script);
  });
})();

(() => {
  const style = document.createElement('style');
  style.textContent = `
    .landing-main .hero-stage h1 .hero-title-line {
      display: block;
    }

    .landing-main .hero-lede,
    .landing-main .cta-helper,
    .landing-main .micro-note {
      max-width: 860px !important;
    }
  `;
  document.head.appendChild(style);
})();

(() => {
  const variants = {
    '/index-v2.html': 'home',
    '/student-v2.html': 'student',
    '/artist-v2.html': 'artist',
    '/reviewer-v2.html': 'reviewer',
  };

  const pathname = window.location.pathname;
  const variant = variants[pathname];
  if (!variant) return;

  const applyVariant = () => {
    const hero = document.querySelector('.landing-main .hero-copy');
    const title = document.getElementById('hero-title');
    if (!hero || !title) return;

    const ledes = [...hero.querySelectorAll('.hero-lede')];

    if (variant === 'home') {
      title.innerHTML = '<span class="made-word">Was AI used?</span><span class="hero-title-line">That\'s only the first question.</span>';
      ledes[0].textContent = 'What did the person actually do? How was AI used? Which decisions shaped the work?';
      ledes[1].textContent = 'A finished work doesn\'t always make those answers visible.';
      ledes[2].innerHTML = '<strong>AsMade creates a MADE Record</strong> for one specific work. It brings that context together — including what information is available about the process and what remains unknown.';
    }

    if (variant === 'student') {
      title.innerHTML = '<span class="made-word">Used AI in an assignment?</span><span class="hero-title-line">Show what you did.</span>';
      ledes[0].textContent = 'A finished assignment shows the result. But the result alone doesn\'t always show what you did, where AI was used, or which decisions you made.';
      ledes[1].innerHTML = '<strong>A MADE Record</strong> brings that context together for one specific assignment: what you did, how AI was used, the decisions that shaped the work, and the information available about the process.';
    }

    if (variant === 'artist') {
      title.innerHTML = '<span class="made-word">They see the AI.</span><span class="hero-title-line">Do they see your creative role?</span>';
      ledes[0].textContent = 'The finished work doesn\'t always show what you contributed, what you selected or changed, which decisions you made, or how AI fit into the process.';
      ledes[1].innerHTML = '<strong>A MADE Record</strong> brings that context together for one specific work: what you did, how AI was used, the decisions that shaped the work, available materials, and what remains unknown.';
      if (ledes[2]) ledes[2].remove();
    }

    if (variant === 'reviewer') {
      title.innerHTML = '<span class="made-word">When AI is part of the work,</span><span class="hero-title-line">what are you actually judging?</span>';
      ledes[0].textContent = 'The finished work shows the result. It doesn\'t always show what the person did, how AI was used, or which decisions shaped the work.';
      ledes[1].innerHTML = '<strong>A MADE Record</strong> brings that context together for one specific work. It shows what the person did, how AI was used, the actions and decisions that shaped the work, what information is available about the process, and what remains unknown.';
    }

    const variantLinks = {
      '/': '/index-v2.html',
      'student.html': '/student-v2.html',
      '/student.html': '/student-v2.html',
      'artist.html': '/artist-v2.html',
      '/artist.html': '/artist-v2.html',
      'reviewer.html': '/reviewer-v2.html',
      '/reviewer.html': '/reviewer-v2.html',
    };

    document.querySelectorAll('a[href]').forEach((link) => {
      const href = link.getAttribute('href');
      if (Object.prototype.hasOwnProperty.call(variantLinks, href)) {
        link.setAttribute('href', variantLinks[href]);
      }
    });

    document.documentElement.dataset.heroVariant = '2';
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyVariant, { once: true });
  } else {
    applyVariant();
  }
})();
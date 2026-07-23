(()=>{
  const items=[...document.querySelectorAll('.fade')];
  if(!items.length) return;

  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce){
    items.forEach(el=>el.classList.add('on'));
    return;
  }

  if(!('IntersectionObserver' in window)){
    items.forEach(el=>el.classList.add('on'));
    return;
  }

  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting) return;
      entry.target.classList.add('on');
      observer.unobserve(entry.target);
    });
  },{threshold:.1});

  items.forEach(el=>observer.observe(el));
})();

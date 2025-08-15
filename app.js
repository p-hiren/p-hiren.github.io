// App interactions extracted from index.html
(function(){
  function updateCountdown(){
    const now = new Date();
    let nextBirthday = new Date(now.getFullYear(), 2, 15);
    if(now > nextBirthday) nextBirthday.setFullYear(nextBirthday.getFullYear()+1);
    const diff = nextBirthday - now;
    const days = Math.floor(diff / (1000*60*60*24));
    const hours = Math.floor((diff / (1000*60*60)) % 24);
    const minutes = Math.floor((diff / (1000*60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    const el = document.getElementById('countdown');
    if(el) el.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }
  setInterval(updateCountdown,1000);
  updateCountdown();

  // Fluid glass effect responding to pointer movement (smooth, natural)
  (function(){
    const glass = document.getElementById('glass');
    if(!glass) return;
    const highlight = document.getElementById('glassHighlight');
    if(!highlight) return;

    const reflection = document.createElement('div');
    reflection.className = 'glass-reflection';
    glass.appendChild(reflection);

    let pointer = { x: NaN, y: NaN };
    let target = { x: 0, y: 0 };

    const rect = () => glass.getBoundingClientRect();

    function handlePointer(clientX, clientY){
      const r = rect();
      const px = (clientX - r.left) / r.width;
      const py = (clientY - r.top) / r.height;
      const cx = Math.max(0, Math.min(1, px));
      const cy = Math.max(0, Math.min(1, py));
      target.x = (cx - 0.5) * 2;
      target.y = (cy - 0.5) * 2;
      pointer.x = clientX; pointer.y = clientY;
    }

    function onPointerMove(e){ handlePointer(e.clientX, e.clientY); }
    function onPointerEnd(){ target.x = 0; target.y = 0; pointer.x = NaN; pointer.y = NaN; }

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerEnd);
    window.addEventListener('pointercancel', onPointerEnd);
    window.addEventListener('pointerleave', onPointerEnd);

    let rx = 0, ry = 0;
    const stiffness = 0.16; // slightly snappier
    const friction = 0.08; // smoothing

    // keyboard accessibility: arrow keys nudge the tilt
    glass.addEventListener('keydown', (ev) => {
      const step = 0.18;
      if (ev.key === 'ArrowLeft') target.x = Math.max(-1, target.x - step);
      if (ev.key === 'ArrowRight') target.x = Math.min(1, target.x + step);
      if (ev.key === 'ArrowUp') target.y = Math.max(-1, target.y - step);
      if (ev.key === 'ArrowDown') target.y = Math.min(1, target.y + step);
      if (ev.key === 'Enter' || ev.key === ' ') {
        // keyboard 'click' ripple
        triggerRipple(r.rectWidth ? r.rectWidth/2 : 100, r.rectHeight ? r.rectHeight/2 : 40);
      }
    });

    // ripple helper scoped to a host element
    function createRipple(host, x, y){
      const r = host.getBoundingClientRect();
      const el = document.createElement('div');
      el.className = 'ripple';
      const size = Math.max(r.width, r.height) * 1.8;
      el.style.width = el.style.height = size + 'px';
      el.style.left = (x - size/2) + 'px';
      el.style.top = (y - size/2) + 'px';
      host.appendChild(el);
      requestAnimationFrame(()=>{
        el.style.transform = 'scale(1)';
        el.style.opacity = '0';
      });
      setTimeout(()=> el.remove(), 700);
    }

    // attach ripple to the glass container (background waves) but stop when controls handle their own
    glass.addEventListener('pointerdown', (ev) => {
      // if a control inside handled it, ignore (we stop propagation on controls)
      if (ev._rippleHandled) return;
      const r = rect();
      const x = ev.clientX - r.left;
      const y = ev.clientY - r.top;
      createRipple(glass, x, y);
    });

    // apply interactive ripple/focus behavior to all buttons and .btn/.cta links
    const interactiveSelectors = 'button, .btn, .cta, a.btn, a.cta';
    const interactives = Array.from(glass.querySelectorAll(interactiveSelectors)).concat(Array.from(document.querySelectorAll(interactiveSelectors)));
    // dedupe
    const uniq = Array.from(new Set(interactives));
    uniq.forEach((el) => {
      // pointerdown ripple
      el.addEventListener('pointerdown', (ev) => {
        try{
          ev._rippleHandled = true; // mark event to prevent glass ripple
        }catch(e){}
        const rectHost = el.getBoundingClientRect();
        const x = ev.clientX - rectHost.left;
        const y = ev.clientY - rectHost.top;
        createRipple(el, x, y);
      });

      // keyboard ripple on Enter / Space
      el.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          const rectHost = el.getBoundingClientRect();
          const x = rectHost.width / 2;
          const y = rectHost.height / 2;
          createRipple(el, x, y);
        }
      });

      // improve focus-visible outline for keyboard users
      el.addEventListener('focus', (ev) => {
        el.classList.add('focused');
      });
      el.addEventListener('blur', (ev) => {
        el.classList.remove('focused');
      });
    });

    function tick(){
      rx += (target.x - rx) * stiffness;
      ry += (target.y - ry) * stiffness;

      // apply a tiny friction (damping) to avoid abrupt stops
      rx *= (1 - friction);
      ry *= (1 - friction);

      const tiltX = (ry * 6);
      const tiltY = (-rx * 7);
      glass.style.transform = `translate(-50%, -50%) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;

      const r = rect();
      if(!isNaN(pointer.x) && !isNaN(pointer.y)){
        const cx = Math.max(0, Math.min(r.width, pointer.x - r.left));
        const cy = Math.max(0, Math.min(r.height, pointer.y - r.top));
        highlight.style.background = `radial-gradient(circle at ${cx}px ${cy}px, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.10) 40%, rgba(255,255,255,0.02) 65%)`;
        highlight.style.opacity = 0.92;
      } else {
        highlight.style.opacity = Math.max(0, highlight.style.opacity - 0.02);
      }

      const refX = (-rx * 12);
      const refY = (-ry * 10);
      reflection.style.transform = `translate3d(${refX}px, ${refY}px, 0)`;

      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();

  // Contact modal behavior
  (function(){
    const open = document.getElementById('openContact');
    const modal = document.getElementById('contactModal');
    const backdrop = document.getElementById('contactBackdrop');
    const close = document.getElementById('closeContact');
    const copyBtn = document.getElementById('copyEmail');
    const toast = document.getElementById('toast');
    const EMAIL = 'contact.hiren@icloud.com';
    function showToast(msg){
      if(!toast) return;
      toast.textContent = msg; toast.classList.add('show'); toast.setAttribute('aria-hidden','false');
      setTimeout(()=>{ toast.classList.remove('show'); toast.setAttribute('aria-hidden','true'); }, 2200);
    }
    function openModal(){ if(modal) modal.setAttribute('aria-hidden','false'); }
    function closeModal(){ if(modal) modal.setAttribute('aria-hidden','true'); }
    if(open) open.addEventListener('click', openModal);
    if(close) close.addEventListener('click', closeModal);
    if(backdrop) backdrop.addEventListener('click', closeModal);
    if(copyBtn) copyBtn.addEventListener('click', async ()=>{
      try{ await navigator.clipboard.writeText(EMAIL); showToast('Email copied to clipboard'); }
      catch(e){ showToast('Copy failed — ' + EMAIL); }
    });
  })();
})();

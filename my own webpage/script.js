/* ==========================================================================
   MOTION BACKGROUND ENGINE — Claymorphism Blob & Particle Field
   Palette: warm clay #EDE7DE · lavender #D4C8E2 · sage #C5D4BE · peach #EED8CE
   ========================================================================== */

(function motionBg() {
    const canvas = document.getElementById('motionBg');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // ── Palette (matches neobrutalism CSS vars) ──────────────────────────
    const PALETTE = [
        { r: 212, g: 200, b: 226, a: 0.55 }, // lavender  #D4C8E2
        { r: 197, g: 212, b: 190, a: 0.50 }, // sage      #C5D4BE
        { r: 238, g: 216, b: 206, a: 0.52 }, // peach     #EED8CE
        { r: 237, g: 231, b: 222, a: 0.45 }, // clay base #EDE7DE
        { r: 180, g: 195, b: 170, a: 0.42 }, // deep sage
        { r: 224, g: 210, b: 236, a: 0.48 }, // deep lavender
    ];

    // ── Resize handling ───────────────────────────────────────────────────
    let W, H;
    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
        buildBlobs();
    }

    // ── Blob class ────────────────────────────────────────────────────────
    class Blob {
        constructor(idx) { this.idx = idx; this.reset(true); }

        reset(init) {
            const p = PALETTE[Math.floor(Math.random() * PALETTE.length)];
            this.color = p;
            this.r   = W * (0.22 + Math.random() * 0.28);   // 22–50 % of viewport
            this.x   = Math.random() * W;
            this.y   = init ? Math.random() * H : Math.random() * H;
            this.vx  = (Math.random() - 0.5) * 0.28;        // slow drift
            this.vy  = (Math.random() - 0.5) * 0.22;
            // breathing / pulsing
            this.breatheAmp   = this.r * (0.04 + Math.random() * 0.08);
            this.breatheSpeed = 0.0005 + Math.random() * 0.0008;
            this.breathePhase = Math.random() * Math.PI * 2;
            // wobble offset for organic shape
            this.wobbleAmp    = this.r * (0.05 + Math.random() * 0.10);
            this.wobbleSpeed  = 0.0003 + Math.random() * 0.0005;
            this.wobblePhase  = Math.random() * Math.PI * 2;
            this.t = 0;
        }

        update(dt) {
            this.t  += dt;
            this.x  += this.vx;
            this.y  += this.vy;
            // soft boundary bounce
            if (this.x < -this.r * 0.5) this.x = W + this.r * 0.5;
            if (this.x > W + this.r * 0.5) this.x = -this.r * 0.5;
            if (this.y < -this.r * 0.5) this.y = H + this.r * 0.5;
            if (this.y > H + this.r * 0.5) this.y = -this.r * 0.5;
        }

        draw() {
            const breathe = Math.sin(this.t * this.breatheSpeed + this.breathePhase) * this.breatheAmp;
            const wobble  = Math.sin(this.t * this.wobbleSpeed  + this.wobblePhase)  * this.wobbleAmp;
            const cx = this.x + wobble;
            const cy = this.y;
            const cr = Math.max(10, this.r + breathe);

            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
            const { r, g, b, a } = this.color;
            grad.addColorStop(0,   `rgba(${r},${g},${b},${a})`);
            grad.addColorStop(0.5, `rgba(${r},${g},${b},${a * 0.55})`);
            grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);

            ctx.beginPath();
            ctx.arc(cx, cy, cr, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();
        }
    }

    // ── Particle class ────────────────────────────────────────────────────
    class Particle {
        constructor() { this.spawn(); }

        spawn() {
            const p = PALETTE[Math.floor(Math.random() * PALETTE.length)];
            this.x     = Math.random() * W;
            this.y     = H + 10;
            this.vy    = -(0.25 + Math.random() * 0.55);    // floats upward
            this.vx    = (Math.random() - 0.5) * 0.3;
            this.size  = 2 + Math.random() * 4;
            this.life  = 0;
            this.maxLife = 280 + Math.random() * 220;
            this.r = p.r; this.g = p.g; this.b = p.b;
        }

        update() {
            this.life++;
            this.x += this.vx;
            this.y += this.vy;
            if (this.life > this.maxLife || this.y < -20) this.spawn();
        }

        draw() {
            const progress = this.life / this.maxLife;
            const alpha = progress < 0.15
                ? progress / 0.15 * 0.55
                : (1 - progress) * 0.55;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.r},${this.g},${this.b},${alpha})`;
            ctx.fill();
        }
    }

    // ── Build scene ───────────────────────────────────────────────────────
    const BLOB_COUNT     = 7;
    const PARTICLE_COUNT = 38;
    let blobs = [], particles = [];

    function buildBlobs() {
        blobs = Array.from({ length: BLOB_COUNT },     (_, i) => new Blob(i));
        particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle());
        // stagger particle start positions
        particles.forEach(p => { p.y = Math.random() * H; p.life = Math.random() * p.maxLife; });
    }

    // ── Render loop ───────────────────────────────────────────────────────
    let lastTs = 0;

    function render(ts) {
        const dt = ts - lastTs;
        lastTs   = ts;

        // Clear to the warm clay base colour so the page body doesn't bleed through weirdly
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#EDE7DE';
        ctx.fillRect(0, 0, W, H);

        // Blobs — drawn with additive softness via globalCompositeOperation
        ctx.globalCompositeOperation = 'source-over';
        blobs.forEach(b => { b.update(dt); b.draw(); });

        // Subtle noise-style overlay (very fine cross-hatch dots) — drawn once
        // at low opacity to add the organic clay texture
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = 'rgba(180,165,148,0.055)';
        const step = 12;
        for (let gy = 0; gy < H; gy += step) {
            for (let gx = 0; gx < W; gx += step) {
                if ((gx + gy) % (step * 2) === 0) {
                    ctx.beginPath();
                    ctx.arc(gx, gy, 1, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // Particles on top
        ctx.globalCompositeOperation = 'source-over';
        particles.forEach(p => { p.update(); p.draw(); });

        requestAnimationFrame(render);
    }

    // ── Boot ──────────────────────────────────────────────────────────────
    window.addEventListener('resize', resize, { passive: true });
    resize();
    requestAnimationFrame(render);
})();

/* ==========================================================================
   PREMIUM PORTFOLIO — INTERACTION ENGINE v2
   ========================================================================== */

(function () {
    'use strict';
    try {

    // -------------------------------------------------------------------------
    // 1. PAGE LOADER
    // -------------------------------------------------------------------------
    const pageLoader = document.getElementById('pageLoader');

    window.addEventListener('load', () => {
        // Give the loader bar animation time to complete (1.2s), then fade out
        setTimeout(() => {
            pageLoader.classList.add('loaded');
        }, 450);
    });


    // -------------------------------------------------------------------------
    // 2. THEME CONTROLLER — Dark / Light with localStorage persistence
    // -------------------------------------------------------------------------
    const htmlEl = document.documentElement;
    const savedTheme = localStorage.getItem('theme') || 'dark';
    htmlEl.setAttribute('data-theme', savedTheme);


    // -------------------------------------------------------------------------
    // 4. SCROLL PROGRESS BAR
    // -------------------------------------------------------------------------
    const progressBar = document.getElementById('scrollProgressBar');

    let isScrolling = false;

    window.addEventListener('scroll', () => {
        if (!isScrolling) {
            window.requestAnimationFrame(updateScroll);
            isScrolling = true;
        }
    }, { passive: true });

    function updateScroll() {
        const scrollTop  = window.scrollY;
        const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
        const pct        = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        if (progressBar) progressBar.style.width = pct + '%';

        handleNavbar(scrollTop);
        handleBackToTop(scrollTop);
        updateScrollSpy();
        
        isScrolling = false;
    }


    // -------------------------------------------------------------------------
    // 5. FLOATING NAVBAR (compact on scroll)
    // -------------------------------------------------------------------------
    const navbarHeader = document.getElementById('navbarHeader');

    function handleNavbar(scrollY) {
        if (scrollY > 60) {
            navbarHeader.classList.add('scrolled');
        } else {
            navbarHeader.classList.remove('scrolled');
        }
    }


    // -------------------------------------------------------------------------
    // 6. BACK TO TOP BUTTON
    // -------------------------------------------------------------------------
    const backToTopBtn = document.getElementById('backToTop');

    function handleBackToTop(scrollY) {
        if (backToTopBtn) {
            if (scrollY > 500) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        }
    }

    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }


    // -------------------------------------------------------------------------
    // 7. MOBILE NAVIGATION — Hamburger + Overlay Backdrop
    // -------------------------------------------------------------------------
    const menuToggle = document.getElementById('menuToggle');
    const navMenu    = document.getElementById('navMenu');
    const navOverlay = document.getElementById('navOverlay');
    const navLinks   = document.querySelectorAll('.nav-link');

    function openMenu() {
        menuToggle.classList.add('open');
        navMenu.classList.add('open');
        navOverlay.classList.add('visible');
        document.body.style.overflow = 'hidden'; // Prevent scroll when menu open
    }

    function closeMenu() {
        menuToggle.classList.remove('open');
        navMenu.classList.remove('open');
        navOverlay.classList.remove('visible');
        document.body.style.overflow = '';
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.contains('open') ? closeMenu() : openMenu();
        });
    }

    // Close on overlay click
    if (navOverlay) {
        navOverlay.addEventListener('click', closeMenu);
    }

    // Close on nav link click
    navLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMenu();
    });


    // -------------------------------------------------------------------------
    // 8. SCROLL SPY — Active nav link highlighting
    // -------------------------------------------------------------------------
    const sections = document.querySelectorAll('section[id]');

    function updateScrollSpy() {
        const scrollMid = window.scrollY + window.innerHeight / 2;

        sections.forEach(section => {
            const top    = section.offsetTop;
            const bottom = top + section.offsetHeight;
            const id     = section.getAttribute('id');
            const link   = document.querySelector(`.nav-link[href="#${id}"]`);

            if (link) {
                if (scrollMid >= top && scrollMid < bottom) {
                    navLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                }
            }
        });
    }


    // -------------------------------------------------------------------------
    // 9. INTERSECTION OBSERVER — Scroll Reveal Animations
    // -------------------------------------------------------------------------
    const revealItems = document.querySelectorAll('.reveal-item');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            try {
                if (entry.isIntersecting) {
                    // Stagger delay based on position among siblings (guard parentElement)
                    const parent = entry.target.parentElement;
                    let idx = 0;
                    if (parent && parent.children) {
                        const siblings = Array.from(parent.children);
                        idx = Math.max(0, siblings.indexOf(entry.target));
                    }
                    entry.target.style.transitionDelay = (idx * 80) + 'ms';
                    entry.target.classList.add('active');
                    revealObserver.unobserve(entry.target);
                }
            } catch (innerErr) {
                // Non-fatal per-item error — continue with other entries
                console.error('revealObserver item error:', innerErr);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealItems.forEach(item => {
        try { revealObserver.observe(item); } catch (e) { /* ignore observe errors */ }
    });

    const heroDynamicText = document.getElementById('heroDynamicText');
    const cursorFollow = document.getElementById('cursorFollow');

    const heroTextOptions = [
        'Help You Grow',
        'Convert More Leads',
        'Stand Out Boldly',
        'Launch Faster',
        'Win More Clients'
    ];
    let heroTextIndex = 0;

    if (heroDynamicText) {
        setInterval(() => {
            heroTextIndex = (heroTextIndex + 1) % heroTextOptions.length;
            heroDynamicText.textContent = heroTextOptions[heroTextIndex];
        }, 3200);
    }

    if (cursorFollow && window.matchMedia('(hover: hover)').matches) {
        document.addEventListener('mousemove', (e) => {
            cursorFollow.style.left = `${e.clientX}px`;
            cursorFollow.style.top = `${e.clientY}px`;
        });

        document.querySelectorAll('a, button, .btn, .portfolio-card, .service-card, .why-card, .testimonial-card, .contact-method-item').forEach(el => {
            el.addEventListener('mouseenter', () => cursorFollow.classList.add('active'));
            el.addEventListener('mouseleave', () => cursorFollow.classList.remove('active'));
        });
    }


    // -------------------------------------------------------------------------
    // 10. ANIMATED STAT COUNTERS
    // -------------------------------------------------------------------------
    const statNumbers = document.querySelectorAll('.stat-number[data-target]');

    function animateCounter(el, target, duration = 1800) {
        let start = null;
        const step = (timestamp) => {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(eased * target);
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                el.textContent = target;
            }
        };
        requestAnimationFrame(step);
    }

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            try {
                if (entry.isIntersecting) {
                    const target = parseInt(entry.target.getAttribute('data-target'), 10) || 0;
                    if (target > 0) animateCounter(entry.target, target);
                    counterObserver.unobserve(entry.target);
                }
            } catch (err) {
                console.error('counterObserver error:', err);
            }
        });
    }, { threshold: 0.6 });

    statNumbers.forEach(el => counterObserver.observe(el));


    // -------------------------------------------------------------------------
    // 11. METRIC PROGRESS BARS
    // -------------------------------------------------------------------------
    const metricBars = document.querySelectorAll('.metric-bar[data-width]');

    const barObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            try {
                if (entry.isIntersecting) {
                    const w = entry.target.getAttribute('data-width') || '';
                    entry.target.style.width = w;
                    barObserver.unobserve(entry.target);
                }
            } catch (err) {
                console.error('barObserver error:', err);
            }
        });
    }, { threshold: 0.5 });

    metricBars.forEach(bar => barObserver.observe(bar));


    // -------------------------------------------------------------------------
    // 12. PORTFOLIO FILTER — Category filtering with CSS class transitions
    // -------------------------------------------------------------------------
    const filterBtns    = document.querySelectorAll('.filter-btn');
    const portfolioItems = document.querySelectorAll('.portfolio-item');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');

            portfolioItems.forEach(item => {
                const cat = item.getAttribute('data-category');
                const show = filter === 'all' || cat === filter;

                if (show) {
                    item.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                }
            });
        });
    });


    // -------------------------------------------------------------------------
    // 13. BUDGET SLIDER — Live formatted readout
    // -------------------------------------------------------------------------
    const budgetSlider = document.getElementById('projectBudget');
    const budgetDisplay = document.getElementById('budgetValue');

    if (budgetSlider && budgetDisplay) {
        const formatBudget = (val) => {
            const n = parseInt(val, 10);
            return n >= 10000 ? '₹10,000+' : '₹' + n.toLocaleString();
        };

        // Update gradient track fill to show progress
        const updateSliderTrack = (val) => {
            const min = parseInt(budgetSlider.min, 10);
            const max = parseInt(budgetSlider.max, 10);
            const pct = ((val - min) / (max - min)) * 100;
            budgetSlider.style.background = `linear-gradient(to right, var(--accent-primary) ${pct}%, var(--bg-primary) ${pct}%)`;
        };

        budgetSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            budgetDisplay.textContent = formatBudget(val);
            updateSliderTrack(val);
        });

        // Initialise on page load
        updateSliderTrack(budgetSlider.value);
        budgetDisplay.textContent = formatBudget(budgetSlider.value);
    }


    // -------------------------------------------------------------------------
    // 14. CONTACT FORM — Send to backend (Email + WhatsApp)
    // -------------------------------------------------------------------------
    const contactForm       = document.getElementById('projectContactForm');
    const formSuccess       = document.getElementById('formSuccessMessage');
    const btnResetForm      = document.getElementById('btnResetForm');

    if (contactForm && formSuccess) {
        const DEFAULT_SUBMIT_HTML = `<span>Send Proposal Request</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;

        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const submitBtn = document.getElementById('formSubmitBtn');

            // Simple client-side validation for required fields
            const formData = new FormData(contactForm);
            const name = String(formData.get('name') || '').trim();
            const email = String(formData.get('email') || '').trim();
            const phone = String(formData.get('phone') || '').trim();
            const projectType = String(formData.get('projectType') || '').trim();
            const message = String(formData.get('message') || '').trim();

            if (!name || !email || !phone || !projectType || !message) {
                alert('Please fill all required fields before submitting the form.');
                return;
            }

            // Disable button and show sending state
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span>Sending your request…</span>`;

            const payload = { name, email, phone, projectType, message };

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);

            fetch('/api/lead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            }).then(async (res) => {
                clearTimeout(timeout);
                if (res.ok) {
                    // Show success state
                    contactForm.classList.add('fading');
                    contactForm.style.opacity = '0';
                    contactForm.style.transform = 'scale(0.97)';

                    setTimeout(() => {
                        contactForm.style.display = 'none';
                        formSuccess.style.display = 'flex';
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = DEFAULT_SUBMIT_HTML;

                        // Reset the form fields
                        contactForm.reset();
                        if (budgetSlider && budgetDisplay) {
                            budgetSlider.value = 3500;
                            budgetDisplay.textContent = '₹3,500';
                            budgetSlider.dispatchEvent(new Event('input'));
                        }
                    }, 350);
                } else {
                    const text = await res.text().catch(() => 'Server error');
                    alert('Failed to send request: ' + text);
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = DEFAULT_SUBMIT_HTML;
                }
            }).catch(err => {
                clearTimeout(timeout);
                if (err.name === 'AbortError') {
                    alert('Request timed out. Please try again.');
                } else {
                    alert('Network error. Please check your connection and try again.');
                    console.error('submit error:', err);
                }
                submitBtn.disabled = false;
                submitBtn.innerHTML = DEFAULT_SUBMIT_HTML;
            });
        });

        if (btnResetForm) {
            btnResetForm.addEventListener('click', () => {
                formSuccess.style.display = 'none';
                contactForm.reset();
                contactForm.style.display = 'flex';
                contactForm.style.opacity = '0';
                contactForm.style.transform = 'scale(0.97)';
                contactForm.classList.remove('fading');

                // Re-init slider
                if (budgetSlider && budgetDisplay) {
                    budgetSlider.value = 3500;
                    budgetDisplay.textContent = '₹3,500';
                    budgetSlider.dispatchEvent(new Event('input'));
                }

                requestAnimationFrame(() => {
                    contactForm.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                    contactForm.style.opacity = '1';
                    contactForm.style.transform = 'scale(1)';
                });
            });
        }
    }


    // -------------------------------------------------------------------------
    // 15. NEWSLETTER FORM
    // -------------------------------------------------------------------------
    const newsletterForm = document.getElementById('newsletterForm');

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = newsletterForm.querySelector('input[type="email"]');
            const btn        = newsletterForm.querySelector('button');

            const originalHTML = btn.innerHTML;
            btn.innerHTML = '✓';
            btn.style.background = 'var(--accent-secondary)';

            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.style.background = '';
                emailInput.value = '';
            }, 2500);
        });
    }


    // -------------------------------------------------------------------------
    // 16. PREMIUM 3D TILT INTERACTION
    // -------------------------------------------------------------------------
    const tiltCards = document.querySelectorAll('.service-card, .why-card, .testimonial-card, .portfolio-card, .hero-live-panels .live-card');

    tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const cx = rect.width / 2;
            const cy = rect.height / 2;

            // Calculate rotation (max ±10 deg)
            const rotateX = ((y - cy) / cy) * -10;
            const rotateY = ((x - cx) / cx) * 10;

            // Calculate glare position (percentage)
            const glareX = (x / rect.width) * 100;
            const glareY = (y / rect.height) * 100;

            card.style.setProperty('--rotate-x', `${rotateX}deg`);
            card.style.setProperty('--rotate-y', `${rotateY}deg`);
            card.style.setProperty('--glare-x', `${glareX}%`);
            card.style.setProperty('--glare-y', `${glareY}%`);

            card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.setProperty('--rotate-x', '0deg');
            card.style.setProperty('--rotate-y', '0deg');
        });
    });


    // -------------------------------------------------------------------------
    // 17. SMOOTH ANCHOR SCROLL (for browsers that don't support CSS scroll-behavior)
    // -------------------------------------------------------------------------
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                e.preventDefault();
                const offset = 80; // navbar height
                const top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });


    // -------------------------------------------------------------------------
    // 18. SECTION ENTRANCE — Trigger initial scroll state on page load
    // -------------------------------------------------------------------------
    // Run once on load to set any in-view items immediately
    window.dispatchEvent(new Event('scroll'));
    } catch (err) {
        console.error('Interaction engine error:', err);
    }

})();

// -------------------------------------------------------------------------
// 19. AUTH REDIRECT
// -------------------------------------------------------------------------
(async () => {
    const supabase = window.CodeMintAuth;
    if (!supabase) {
        window.location.replace('login.html');
        return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.replace('login.html');
        return;
    }

    sessionStorage.setItem('portfolio_unlocked', 'true');
})();

// -------------------------------------------------------------------------
// 20. LOGOUT LOGIC
// -------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('linkLogout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('portfolio_unlocked');
            if (window.CodeMintAuth) window.CodeMintAuth.auth.signOut().catch(() => {});
            
            // Fade out the page nicely before redirecting
            document.body.style.transition = 'opacity 0.4s ease';
            document.body.style.opacity = '0';
            
            setTimeout(() => {
                window.location.replace('login.html');
            }, 400);
        });
    }
});

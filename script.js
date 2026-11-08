/* ---------- Crop helper: reuse one image as many thumbnails ---------- */
const clamp = v => Math.max(0, Math.min(100, v));
function crop([cx, cy, z], portrait = false) {
    const py = clamp((cy * z - 0.5) / (z - 1) * 100);
    if (!portrait) {
        const px = clamp((cx * z - 0.5) / (z - 1) * 100);
        return `--bs:${z * 100}% auto;--bp:${px}% ${py}%`;
    }
    const iw = 1.7778 * z, cw = 0.6667;
    const px = clamp((cx * iw - cw / 2) / (iw - cw) * 100);
    return `--bs:auto ${z * 100}%;--bp:${px}% ${py}%`;
}

const C = {
    ryukEyes: [.31, .21, 2.3], ryukGrin: [.30, .55, 2.1], light: [.78, .33, 2.3],
    book: [.76, .82, 2.3], lightEyes: [.77, .34, 3.4], wide: [.5, .5, 1.05], hair: [.62, .15, 2.0], teeth: [.28, .72, 2.4],
};
const PORTRAIT = {
    a: [.36, .48, 1.5], b: [.78, .35, 1.5], c: [.76, .85, 1.5], d: [.31, .22, 1.6], e: [.28, .62, 1.5],
};

const icon = {
    play: '<svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    like: '<svg viewBox="0 0 24 24"><path d="M7 11v9H4v-9zM7 11l4-8c2 0 3 1 3 3l-1 4h6a2 2 0 012 2l-2 7a2 2 0 01-2 1H7"/></svg>',
    down: '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
};

const eps = [
    ['Rebirth', 'ryukGrin'], ['Confrontation', 'lightEyes'], ['Dealings', 'book'], ['Pursuit', 'ryukEyes'],
    ['Tactics', 'light'], ['Unraveling', 'teeth'], ['Overcast', 'hair'], ['Glare', 'wide'],
];
const tags = ['Psychological', 'Thriller', 'Supernatural', 'Mystery', 'Dark'];

function card(i, withProgress) {
    const [title, key] = eps[i % eps.length];
    const match = 99 - ((i * 3) % 9);
    const tg = [tags[i % 5], tags[(i + 2) % 5], tags[(i + 3) % 5]].join(' • ');
    const prog = withProgress ? `<div class="prog"><i style="width:${25 + (i * 17) % 60}%"></i></div>` : '';
    return `<article class="card">
        <div class="thumb" style="${crop(C[key])}"><span class="cap">${title}</span>${prog}</div>
        <div class="panel">
            <div class="acts"><button class="go">${icon.play}</button><button>${icon.plus}</button><button>${icon.like}</button><button class="more">${icon.down}</button></div>
            <p class="m"><b>${match}% Match</b><span class="box">TV-14</span><span>Ep ${i + 1}</span><span>24m</span></p>
            <p class="tg">${tg}</p>
        </div>
    </article>`;
}

document.getElementById('top10').innerHTML = Object.values(PORTRAIT).map((p, i) => `
    <article class="t10-item">
        <span class="num">${i + 1}</span>
        <div class="poster" style="${crop(p, true)}"><span class="cap">${eps[i][0]}</span></div>
    </article>`).join('');
document.getElementById('continue').innerHTML = [3, 0, 5, 1, 6].map(i => card(i, true)).join('');
document.getElementById('trending').innerHTML = [0, 1, 2, 3, 4, 5, 6, 7].map(i => card(i)).join('');
document.getElementById('avatar').style.cssText = crop([.78, .36, 4.5]);

/* ---------- Row arrows ---------- */
document.querySelectorAll('.row').forEach(row => {
    const rail = row.querySelector('.rail');
    ['prev', 'next'].forEach(dir => {
        const b = document.createElement('button');
        b.className = 'arrow ' + dir;
        b.setAttribute('aria-label', dir);
        b.innerHTML = '<svg viewBox="0 0 24 24"><path d="' + (dir === 'prev' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7') + '"/></svg>';
        b.onclick = () => rail.scrollBy({ left: (dir === 'prev' ? -1 : 1) * rail.clientWidth * 0.85, behavior: 'smooth' });
        row.appendChild(b);
    });
});

/* ---------- Title letter-by-letter reveal ---------- */
const title = document.getElementById('title');
title.setAttribute('aria-label', title.textContent);
title.innerHTML = [...title.textContent].map((ch, i) =>
    ch === ' ' ? ' ' : `<span style="--i:${i}" aria-hidden="true">${ch}</span>`).join('');

/* ---------- Nav solid on scroll ---------- */
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('solid', scrollY > 40);
addEventListener('scroll', onScroll, { passive: true }); onScroll();

/* ---------- Parallax + cursor light ---------- */
const hero = document.getElementById('hero');
hero.addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect();
    hero.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5) * 2);
    hero.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5) * 2);
    hero.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    hero.style.setProperty('--my', (e.clientY - r.top) + 'px');
});

/* ---------- Drifting embers ---------- */
(function () {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cv = document.getElementById('embers'), ctx = cv.getContext('2d');
    let W, H, dpr = Math.min(devicePixelRatio || 1, 2);
    const resize = () => { W = cv.width = hero.clientWidth * dpr; H = cv.height = hero.clientHeight * dpr; };
    resize(); addEventListener('resize', resize);
    const N = innerWidth < 720 ? 28 : 60;
    const P = Array.from({ length: N }, () => spawn(true));
    function spawn(initial) {
        return {
            x: Math.random() * W, y: initial ? Math.random() * H : H + 10,
            r: (0.6 + Math.random() * 2) * dpr, v: (0.15 + Math.random() * 0.5) * dpr,
            a: 0.2 + Math.random() * 0.6, ph: Math.random() * 6.28, hot: Math.random() < 0.8,
        };
    }
    (function tick(t) {
        ctx.clearRect(0, 0, W, H);
        P.forEach((p, i) => {
            p.y -= p.v; p.x += Math.sin(t / 1400 + p.ph) * 0.35 * dpr;
            if (p.y < -10) P[i] = spawn(false);
            const fade = Math.min(1, p.y / (H * 0.25), (H - p.y) / (H * 0.1));
            ctx.beginPath();
            ctx.fillStyle = p.hot ? `rgba(255,${70 + p.a * 60 | 0},${60},${p.a * fade})` : `rgba(240,235,230,${p.a * 0.5 * fade})`;
            ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill();
        });
        requestAnimationFrame(tick);
    })(0);
})();

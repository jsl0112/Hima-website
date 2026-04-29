/* =========================================================
   HIMA 官网交互脚本（第五版 · 加入滚动入场动画）
   ========================================================= */

// ========= 0. 动态计算全局缩放比例 --vw-scale =========
// Scene5/Footer：Math.min(vw/1920, 1)，保持上一版效果（不超过设计稿尺寸）
// Hero + Scene1~4：vw/1920（不设上限），实现自适应浏览器分辨率
const updateVwScale = () => {
  const vw = window.innerWidth;
  const scale = Math.min(vw / 1920, 1);       // scene5/footer 用（不超 1）
  const heroScale = vw / 1920;                 // Hero + scene1~4 用（无上限）
  document.documentElement.style.setProperty('--vw-scale', scale);
  document.documentElement.style.setProperty('--hero-scale', heroScale);

  // Hero 首屏：高度 = max(1006 × heroScale, 视口高度)，确保填满浏览器窗口
  const hero = document.querySelector('.hero');
  if (hero) {
    const designH = 1006 * heroScale;
    const vh = window.innerHeight;
    hero.style.height = Math.max(designH, vh) + 'px';
  }

  // Hero canvas 使用 heroScale 缩放
  const heroCanvas = document.querySelector('.hero-canvas');
  if (heroCanvas) {
    heroCanvas.style.transform = 'translateX(-50%) scale(' + heroScale + ')';
  }

  // Scene1~4 也使用 heroScale 动态设置高度
  const adaptiveSections = [
    { id: 'scene1', designH: 941 },
    { id: 'scene2', designH: 962 },
    { id: 'scene3', designH: 984 },
    { id: 'scene4', designH: 636 },
  ];
  adaptiveSections.forEach(function(cfg) {
    var sec = document.getElementById(cfg.id);
    if (sec) {
      sec.style.height = (cfg.designH * heroScale) + 'px';
    }
  });
};
updateVwScale();
window.addEventListener('resize', updateVwScale);

// ========= 1. Stats 数字计数动画（进入视口时触发） =========
const countNums = document.querySelectorAll('.stat-num');
const animateCount = (el) => {
  const raw = el.textContent.trim();
  const match = raw.match(/(\d+)/);
  if (!match) return;
  const target = parseInt(match[1], 10);
  let cur = 0;
  const step = Math.max(1, Math.ceil(target / 30));
  const timer = setInterval(() => {
    cur += step;
    if (cur >= target) {
      cur = target;
      clearInterval(timer);
    }
    el.innerHTML = `${cur}<span class="plus">+</span>`;
  }, 40);
};

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        animateCount(e.target);
        io.unobserve(e.target);
      }
    });
  }, { threshold: .4 });
  countNums.forEach((n) => io.observe(n));
}

// ========= 2. Hero 入场动画（GSAP） =========
if (window.gsap) {
  gsap.from('.hero-title', {
    y: 40, opacity: 0, duration: .9, stagger: .12,
    ease: 'power3.out', delay: .3,
  });
  gsap.from('.hero-subtitle', {
    y: 20, opacity: 0, duration: .8, ease: 'power2.out', delay: .7,
  });
  gsap.from('.hero-icon', {
    scale: 0, opacity: 0, duration: .8,
    stagger: { each: .05, from: 'random' },
    ease: 'back.out(1.7)', delay: .2,
  });
  gsap.from('.hero-kv', {
    y: 30, opacity: 0, duration: 1, ease: 'power3.out', delay: .4,
  });
  gsap.from('.hero-nav', {
    y: -20, opacity: 0, duration: .6, ease: 'power2.out', delay: .1,
  });
  gsap.from('.logo-ticker', {
    opacity: 0, duration: 1, ease: 'power2.out', delay: 1.2,
  });
}

// ========= 3. 滚动渐入上移 · section & 卡片交错 =========
// 3.1 给需要交错的卡片加 .stagger-item 并设置自定义延迟
const attachStagger = () => {
  const groups = [
    // Scene2 社区运营 4 张卡片
    { selector: '#scene2 .s2-card', step: 120 },
    // Scene4 私信营销 9 平台卡片
    { selector: '#scene4 .s4-plat', step: 70 },
    // Scene5 合作游戏 9 张封面
    { selector: '#scene5 .game-card', step: 90 },
    // Scene1 左侧 bullet 列表
    { selector: '#scene1 .s1-bullets li', step: 90 },
    // Scene1 标题下平台 logo 条
    { selector: '#scene1 .s1-plat-bar img', step: 80 },
    // Scene3 左侧特性列表
    { selector: '#scene3 .s3-feat-list li', step: 140 },
    // Scene4 左侧特性列表
    { selector: '#scene4 .s4-features li', step: 110 },
  ];
  groups.forEach(({ selector, step }) => {
    document.querySelectorAll(selector).forEach((el, idx) => {
      el.classList.add('stagger-item');
      el.style.transitionDelay = `${idx * step}ms`;
    });
  });
};
attachStagger();

// 3.2 给 section 的直接子元素（非 stagger-item）做基础渐入延迟
document.querySelectorAll('[data-reveal]').forEach((section) => {
  const kids = section.querySelectorAll(':scope > .scene-canvas > *');
  kids.forEach((el, idx) => {
    // 跳过自带 keyframes 动画的元素（例如 Scene1/2/3 3D icon 掉落）
    if (el.classList.contains('s1-icons-row') || el.classList.contains('s2-icons-row') || el.classList.contains('s3-icons-row')) return;
    el.style.transitionDelay = `${idx * 60}ms`;
  });
});

// 3.3 使用 IntersectionObserver 触发 is-in
if ('IntersectionObserver' in window) {
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        revealIO.unobserve(e.target);

        // Scene2 卡片：stagger 入场完成后切换到 hover 模式
        if (e.target.id === 'scene2') {
          const cards = e.target.querySelectorAll('.s2-card.stagger-item');
          cards.forEach((card) => {
            card.addEventListener('transitionend', function handler(ev) {
              if (ev.propertyName === 'opacity') {
                card.classList.add('stagger-done');
                card.removeEventListener('transitionend', handler);
              }
            });
          });
        }

        // Scene3 icons：掉落动画结束后启用 hover
        if (e.target.id === 'scene3') {
          const icons = e.target.querySelectorAll('.s3-3dicon');
          icons.forEach((icon) => {
            icon.addEventListener('animationend', function handler(ev) {
              if (ev.animationName === 's3IconDrop') {
                icon.classList.add('icon-landed');
                icon.removeEventListener('animationend', handler);
              }
            });
          });
        }

        // Scene4 Line icon：掉落动画结束后启用 hover
        if (e.target.id === 'scene4') {
          const wrap = e.target.closest('.shared-bg-wrap');
          if (wrap) wrap.classList.add('s4-active');
          const icons = wrap ? wrap.querySelectorAll('.s4-3dicon') : [];
          icons.forEach((icon) => {
            icon.addEventListener('animationend', function handler(ev) {
              if (ev.animationName === 's4IconDrop') {
                icon.classList.add('icon-landed');
                icon.removeEventListener('animationend', handler);
              }
            });
          });
          // 兜底
          setTimeout(() => {
            const w = document.querySelector('.shared-bg-wrap');
            if (w) w.querySelectorAll('.s4-3dicon').forEach((ic) => ic.classList.add('icon-landed'));
          }, 2000);
        }
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -8% 0px',
  });
  document.querySelectorAll('[data-reveal]').forEach((sec) => revealIO.observe(sec));
} else {
  // 兜底：无观察器则直接全部显示
  document.querySelectorAll('[data-reveal]').forEach((s) => s.classList.add('is-in'));
  // 兜底也给 s2-card 加上 stagger-done
  document.querySelectorAll('.s2-card').forEach((c) => c.classList.add('stagger-done'));
  // 兜底也给 s3-3dicon 加上 icon-landed
  document.querySelectorAll('.s3-3dicon').forEach((ic) => ic.classList.add('icon-landed'));
  // 兜底也给 s4 Line icon 加上显示
  const sharedWrap = document.querySelector('.shared-bg-wrap');
  if (sharedWrap) {
    sharedWrap.classList.add('s4-active');
    sharedWrap.querySelectorAll('.s4-3dicon').forEach((ic) => ic.classList.add('icon-landed'));
  }
}

// ========= 4. 平滑滚动（导航锚点） =========
document.querySelectorAll('.nav-link, .nav-brand').forEach((a) => {
  a.addEventListener('click', (e) => {
    const href = a.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ========= 5. Tab 切换交互（点击 + 滑动指示条） =========
const initTabSwitcher = () => {
  document.querySelectorAll('.scene-tabs').forEach((tabGroup) => {
    const tabs = tabGroup.querySelectorAll('.tab');
    const indicator = tabGroup.querySelector('.tab-indicator');
    if (!indicator || tabs.length === 0) return;

    // 移动指示条到目标 tab 下方
    const moveIndicator = (tab) => {
      const groupRect = tabGroup.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();
      const left = tabRect.left - groupRect.left + (tabRect.width - 32) / 2;
      indicator.style.left = left + 'px';
      indicator.style.width = '32px';
    };

    // 初始化指示条位置
    const activeTab = tabGroup.querySelector('.tab.active');
    if (activeTab) {
      // 在布局完成后设置初始位置（避免过渡动画）
      requestAnimationFrame(() => {
        indicator.style.transition = 'none';
        moveIndicator(activeTab);
        // 恢复过渡
        requestAnimationFrame(() => {
          indicator.style.transition = '';
        });
      });
    }

    // 点击切换
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        moveIndicator(tab);
      });
    });
  });
};

// 页面加载后初始化 Tab 交互
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTabSwitcher);
} else {
  initTabSwitcher();
}

// ========= 6. 左侧导航小圆点 =========
const initSideDots = () => {
  const dots = document.querySelectorAll('.side-dot');
  const dotsNav = document.getElementById('sideDots');
  if (!dots.length || !dotsNav) return;

  // 点击圆点平滑滚动
  dots.forEach((dot) => {
    dot.addEventListener('click', (e) => {
      e.preventDefault();
      const href = dot.getAttribute('href');
      const target = document.querySelector(href);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // 滚动时高亮对应圆点 + 自动切换深浅色
  const sections = [
    { id: 'hero', theme: 'light' },
    { id: 'scene1', theme: 'dark' },
    { id: 'scene2', theme: 'light' },
    { id: 'scene3', theme: 'dark' },
    { id: 'scene4', theme: 'light' },
  ];

  const updateDots = () => {
    const scrollY = window.scrollY + window.innerHeight * 0.4;
    let activeId = 'hero';
    let activeTheme = 'light';

    for (let i = sections.length - 1; i >= 0; i--) {
      const el = document.getElementById(sections[i].id);
      if (el && el.offsetTop <= scrollY) {
        activeId = sections[i].id;
        activeTheme = sections[i].theme;
        break;
      }
    }

    dots.forEach((d) => {
      d.classList.toggle('active', d.dataset.section === activeId);
    });

    dotsNav.classList.toggle('on-light', activeTheme === 'light');
  };

  window.addEventListener('scroll', updateDots, { passive: true });
  updateDots();
};
initSideDots();

// ========= 7. 游戏卡片交错入场延迟 =========
document.querySelectorAll('#scene5 .game-card').forEach((card, idx) => {
  card.style.transitionDelay = `${idx * 100}ms`;
});

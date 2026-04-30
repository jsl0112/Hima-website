/* =========================================================
   HIMA 官网交互脚本（第五版 · 加入滚动入场动画）
   ========================================================= */

// ========= 0. 视口宽度变量（排除滚动条） =========
// 解决 Windows 经典滚动条占位导致 100vw 大于实际可见区域的问题
// --vw 为实际 clientWidth，CSS 中通过 min(--vw, --max-w) 限制最大 1920px
const setVW = () => {
  const vw = document.documentElement.clientWidth;
  document.documentElement.style.setProperty('--vw', vw + 'px');
};
setVW();
window.addEventListener('resize', setVW);

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
    // Scene5 合作游戏 整图渐入
    { selector: '#scene5 .games-wall-img', step: 0 },
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
    // 使用 offsetLeft + offsetWidth（不受 transform scale 影响）代替 getBoundingClientRect
    const moveIndicator = (tab) => {
      const tabLeft = tab.offsetLeft;
      const tabWidth = tab.offsetWidth;
      // indicator 宽度跟随 tab 文字宽度
      const indicatorWidth = tabWidth;
      const left = tabLeft;
      indicator.style.left = left + 'px';
      indicator.style.width = indicatorWidth + 'px';
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
// 窗口 resize 时重新定位 indicator（适配不同屏幕）
window.addEventListener('resize', initTabSwitcher);

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

// ========= 7. 合作游戏整图渐入（无需交错） =========

// ========= 8. 中英文切换（i18n） =========
const i18n = {
  zh: {
    'page-title': 'HIMA · 懂您的一站式海外游戏运营平台',
    'nav-sm': '社媒管理', 'nav-sq': '社区运营', 'nav-zb': '直播运营', 'nav-sx': '私信营销',
    'nav-cta': '合作咨询',
    'hero-t1a': '懂您的', 'hero-t1b': '一站式', 'hero-t2': '海外游戏运营平台', 'hero-t3': '',
    'hero-sub': '助力出海游戏精细化运营，提供全方位的技术支持与全球化的营销生态集成',
    'stat-t1': '核心场景', 'stat-d1': '社媒、社区、直播、私信<br/>覆盖全生命周期核心运营场景',
    'stat-t2': '主流海外渠道', 'stat-d2': '一站式触达 Discord、Twitch 等<br/>全球主流社媒平台',
    'stat-t3': '游戏项目', 'stat-d3': '拥有PUBGM、三角洲等<br/>出海大作稳定运营经验',
    'stat-t4': '语言支持', 'stat-d4': '中、英、日、韩、德等<br/>多语言本地化运营支持与交付',
    's1-title': '社媒管理', 's1-sub': '覆盖全球主流社交媒体平台，提供发帖、互动、数据分析一体化解决方案',
    's1-more': '更多平台接入中',
    's1-tab1': '发帖编辑', 's1-tab2': '策略排期', 's1-tab3': '数据看板', 's1-tab4': '更多能力', 's1-tab5': '审核工作流',
    's1-bluet': '富文本编辑<br/>一键多发',
    's1-b1': '支持图文、视频、Reel 多格式', 's1-b2': 'AI 翻译 + 多语言一键适配',
    's1-b3': '定时 / 定向发布，全球多时区精准覆盖', 's1-b4': '实时预览各平台展示效果',
    's1-btn1': '🏷 标签', 's1-btn2': '📅 选取时间', 's1-btn3': '⚠ 立即发布', 's1-btn4': '⏩ 添加至队列',
    's2-title': '社区运营', 's2-sub': '司内最强的 Discord 官方私域全场景运营解决方案，助力业务打造全能可控的官方私域社区',
    's2-tab1': '游戏账号绑定', 's2-tab2': '内容管理', 's2-tab3': '端内数据查询', 's2-tab4': '定制营销活动', 's2-tab5': '更多能力',
    's3-title': '直播运营', 's3-sub': '支持主流海外直播平台的丰富营销能力，覆盖掉宝、互动挂件、主播挑战、AI 高光识别',
    's3-tab1': '直播间掉宝', 's3-tab2': '互动挂件', 's3-tab3': '主播挑战活动', 's3-tab4': '更多能力',
    's3-ft': '玩家与主播<br/>互动挑战',
    's3-fd': '基于 Twitch Extension 等能力，开发 Streamer Challenge 等玩家与主播的互动挑战任务。',
    's3-f1': '主播与玩家联动，提升直播互动深度',
    's3-f2': 'Player / Streamer Challenge 双轨并行',
    's3-f3': '任务奖励机制驱动持续参与',
    's4-title': '私信营销', 's4-sub': '海外用户全域精准触达，助力业务拉新、召回、促活、增收',
    's4-tag1': '定时推送', 's4-fd1': '支持全球多时区定时推送，精准覆盖目标用户活跃时段',
    's4-tag2': '定向推送', 's4-fd2': '支持指定号码包定向推送，精细化触达目标用户群体',
    's4-tag3': '条件触发推送', 's4-fd3': '实时监测玩家游戏状态，根据行为条件自动推送匹配内容',
    's4-tag4': '保密测试协议推送', 's4-fd4': '特别打通保密协议签署系统 & CDK 系统，一体化管理测试资格发放',
    's5-title': '合作游戏', 's5-sub': '深度接入游戏生态，实现平台与游戏的无缝联动，持续扩展合作版图，更多游戏陆续接入中',
    'footer-slogan': '一站式海外游戏运营平台',
    'footer-links1': '<a>关于腾讯</a><span class="sep">|</span><a>About Tencent</a><span class="sep">|</span><a>服务协议</a><span class="sep">|</span><a>隐私政策</a><span class="sep">|</span><a>开放平台</a><span class="sep">|</span><a>广告服务</a><span class="sep">|</span><a>腾讯招聘</a><span class="sep">|</span><a>腾讯公益</a><span class="sep">|</span><a>腾讯云</a><span class="sep">|</span><a>客服中心</a><span class="sep">|</span><a>举报中心</a><span class="sep">|</span><a>网址导航</a>',
    'footer-links2': '<a>深圳举报中心</a><span class="sep">|</span><a>深圳公安局</a><span class="sep">|</span><a>抵制违法广告承诺书</a><span class="sep">|</span><a>版权保护投诉指引</a><span class="sep">|</span><a>广东省通管局</a>',
    'footer-company': '粤网文[2017]6138-1456号 新出网证（粤）字010号 网络视听许可证1904073号 网络视听许可证1904073号 增值电信业务经营许可证: 粤B2-20090059 B2-20090028<br/>新闻信息服务许可证 粤府新函[2001]87号 违法和不良信息举报电话：0755-83765566-9 粤公网安备44030002000001号<br/>互联网药品信息服务资格证书 （粤）一非营业性一2017-0153',
  },
  en: {
    'page-title': 'HIMA · Your All-in-One Overseas Game Operations Platform',
    'nav-sm': 'Social Media', 'nav-sq': 'Community', 'nav-zb': 'Live Streaming', 'nav-sx': 'Direct Messaging',
    'nav-cta': 'Contact Us',
    'hero-t1a': 'Your ', 'hero-t1b': 'All-in-One', 'hero-t2': 'Overseas Game', 'hero-t3': 'Operations Platform',
    'hero-sub': 'Empowering overseas game operations with comprehensive tech support and global marketing ecosystem integration',
    'stat-t1': 'Core Scenarios', 'stat-d1': 'Social Media, Community, Live Streaming, DM<br/>Covering full-lifecycle core operation scenarios',
    'stat-t2': 'Overseas Channels', 'stat-d2': 'One-stop access to Discord, Twitch and<br/>other major global social platforms',
    'stat-t3': 'Game Projects', 'stat-d3': 'Proven track record with PUBG Mobile,<br/>Delta Force and other hit titles',
    'stat-t4': 'Languages', 'stat-d4': 'CN, EN, JP, KR, DE and more<br/>Multi-language localized operations & delivery',
    's1-title': 'Social Media Management', 's1-sub': 'Covering all major global social media platforms with integrated posting, engagement and analytics solutions',
    's1-more': 'More platforms coming',
    's1-tab1': 'Post Editor', 's1-tab2': 'Scheduling', 's1-tab3': 'Dashboard', 's1-tab4': 'More Features', 's1-tab5': 'Review Workflow',
    's1-bluet': 'Rich Text Editor<br/>One-Click Multi-Post',
    's1-b1': 'Supports image, video, Reel and more formats', 's1-b2': 'AI translation + one-click multi-language adaptation',
    's1-b3': 'Scheduled / targeted posting across global time zones', 's1-b4': 'Real-time preview across all platforms',
    's1-btn1': '🏷 Tags', 's1-btn2': '📅 Schedule', 's1-btn3': '⚠ Publish Now', 's1-btn4': '⏩ Add to Queue',
    's2-title': 'Community Operations', 's2-sub': 'The most powerful Discord community operations solution, empowering fully-controlled official community management',
    's2-tab1': 'Account Binding', 's2-tab2': 'Content Mgmt', 's2-tab3': 'In-Game Data', 's2-tab4': 'Custom Campaigns', 's2-tab5': 'More Features',
    's3-title': 'Live Streaming', 's3-sub': 'Rich marketing capabilities across major overseas streaming platforms — drops, widgets, streamer challenges, AI highlights',
    's3-tab1': 'Live Drops', 's3-tab2': 'Widgets', 's3-tab3': 'Streamer Challenge', 's3-tab4': 'More Features',
    's3-ft': 'Player & Streamer<br/>Interactive Challenge',
    's3-fd': 'Built on Twitch Extension and more, enabling Streamer Challenge and interactive quests between players and streamers.',
    's3-f1': 'Streamer-player synergy for deeper live engagement',
    's3-f2': 'Dual-track Player / Streamer Challenge system',
    's3-f3': 'Quest reward mechanism driving sustained participation',
    's4-title': 'Direct Messaging', 's4-sub': 'Precision reach across all overseas user touchpoints — acquisition, re-engagement, activation and revenue growth',
    's4-tag1': 'Scheduled Push', 's4-fd1': 'Multi-timezone scheduled push for precise coverage of peak user activity',
    's4-tag2': 'Targeted Push', 's4-fd2': 'Audience-specific targeted push for refined user segment reach',
    's4-tag3': 'Event-Triggered Push', 's4-fd3': 'Real-time player status monitoring with automatic content push based on behavior triggers',
    's4-tag4': 'NDA Test Push', 's4-fd4': 'Seamlessly integrated with NDA signing & CDK systems for unified test qualification management',
    's5-title': 'Partner Games', 's5-sub': 'Deep integration with the gaming ecosystem — seamless platform-game connectivity with an ever-expanding partnership portfolio',
    'footer-slogan': 'One-stop overseas game<br/>operation platform',
    'footer-links1': '<a>About Tencent</a><span class="sep">|</span><a>About Tencent</a><span class="sep">|</span><a>Terms of Service</a><span class="sep">|</span><a>Privacy Policy</a><span class="sep">|</span><a>Open Platform</a><span class="sep">|</span><a>Advertising</a><span class="sep">|</span><a>Tencent Careers</a><span class="sep">|</span><a>Tencent Charity</a><span class="sep">|</span><a>Tencent Cloud</a><span class="sep">|</span><a>Support Center</a><span class="sep">|</span><a>Report Center</a><span class="sep">|</span><a>Site Map</a>',
    'footer-links2': '<a>Shenzhen Report Center</a><span class="sep">|</span><a>Shenzhen Public Security</a><span class="sep">|</span><a>Ad Compliance Commitment</a><span class="sep">|</span><a>Copyright Protection Guide</a><span class="sep">|</span><a>Guangdong Communications Admin</a>',
    'footer-company': 'Yue Wang Wen [2017] 6138-1456 / New Net Certificate (Yue) Zi 010 / Network AV License 1904073 / Telecom Business License: Yue B2-20090059 B2-20090028<br/>News Information Service License Yue Fu Xin Han [2001] 87 / Illegal Info Hotline: 0755-83765566-9 / Yue Gong Wang An Bei 44030002000001<br/>Internet Pharmaceutical Info Service Certificate (Yue) Non-commercial 2017-0153',
  }
};

let currentLang = 'zh';

function switchLang(lang) {
  currentLang = lang;
  const dict = i18n[lang];
  if (!dict) return;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (!dict[key]) return;
    if (el.hasAttribute('data-i18n-html')) {
      el.innerHTML = dict[key];
    } else if (el.tagName === 'TITLE') {
      document.title = dict[key];
    } else {
      el.textContent = dict[key];
    }
  });

  // 英文模式显示第三行标题，中文隐藏
  const heroT3 = document.querySelector('.hero-title-3');
  if (heroT3) heroT3.style.display = lang === 'en' ? '' : 'none';

  // 更新语言按钮标签
  const label = document.getElementById('langLabel');
  if (label) label.textContent = lang === 'zh' ? '英文' : 'CN';

  // 更新 html lang 属性
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';

  // 重新初始化 Tab 指示条位置
  if (typeof initTabSwitcher === 'function') initTabSwitcher();
}

// 语言切换按钮事件
const langToggle = document.getElementById('langToggle');
if (langToggle) {
  langToggle.addEventListener('click', () => {
    switchLang(currentLang === 'zh' ? 'en' : 'zh');
  });
}

/* ===== Footer 鼠标追光 ===== */
(function() {
  const footer = document.querySelector('.site-footer');
  const cursor = document.querySelector('.footer-glow-cursor');
  if (!footer || !cursor) return;

  let rafId = null;
  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;

  footer.addEventListener('mouseenter', () => {
    cursor.style.opacity = '1';
  });

  footer.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
  });

  footer.addEventListener('mousemove', (e) => {
    const rect = footer.getBoundingClientRect();
    targetX = e.clientX - rect.left;
    targetY = e.clientY - rect.top;

    if (!rafId) {
      rafId = requestAnimationFrame(updateCursor);
    }
  });

  function updateCursor() {
    currentX += (targetX - currentX) * 0.12;
    currentY += (targetY - currentY) * 0.12;
    cursor.style.left = currentX + 'px';
    cursor.style.top = currentY + 'px';

    if (Math.abs(targetX - currentX) > 0.5 || Math.abs(targetY - currentY) > 0.5) {
      rafId = requestAnimationFrame(updateCursor);
    } else {
      rafId = null;
    }
  }
})();

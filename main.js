(function () {
  const DESIGN_W = 2560;
  // 从 CSS 变量 --dh 动态读取设计稿高度，保持与 styles.css 一致
  const DESIGN_H = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--dh')
  ) || 9296;
  const viewport = document.querySelector('.viewport');
  const stage = document.getElementById('stage');

  /* --------------------------------------------------------
   * 0) 关键图片预加载：在 full-frame.png 解码完成前，
   *    延迟启用滚动 reveal 观察，避免"图片还没到 → 已触发 in
   *    → 滚动时出现空白/割裂"的问题
   * ------------------------------------------------------ */
  const criticalImageReady = new Promise((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => {
      // 再尝试 decode 一次，确保渲染前像素已就绪
      if (img.decode) {
        img.decode().then(resolve).catch(resolve);
      } else {
        resolve();
      }
    };
    img.src = 'assets/full-frame.png';
  });
  // 标记 body，CSS 可用于控制整体过渡
  criticalImageReady.then(() => {
    document.body.classList.add('bg-ready');
  });


  /* --------------------------------------------------------
   * 1) 自适应缩放（居中），大屏额外缩小 8% 避免过大
   * ------------------------------------------------------ */
  const SHRINK = 0.88;          /* 整体缩放因子，1 = 原尺寸 */
  function applyScale() {
    const vw = window.innerWidth;
    const scale = (vw / DESIGN_W) * SHRINK;
    document.documentElement.style.setProperty('--scale', String(scale));
    viewport.style.height = (DESIGN_H * scale) + 'px';
  }
  applyScale();
  window.addEventListener('resize', applyScale);

  /* --------------------------------------------------------
   * 2) Discord Tab 切换
   *    4 个独立 386×176 卡片，各自用精灵图背景
   *    4 态切图：k_normal / k_hover / k_press / k_set
   *    每张为水平 4-tab 条带，用 background-size:400% 100% 截取
   * ------------------------------------------------------ */
  const discordTabs = document.querySelectorAll('.discord-tab');
  const medias = document.querySelectorAll('.media-panel .m');
  let currentTab = 1;
  let mediaInView = false;

  const SPRITES = {
    normal: 'url("assets/k_normal.png")',
    hover:  'url("assets/k_hover.png")',
    press:  'url("assets/k_press.png")',
    set:    'url("assets/k_set.png")'
  };

  /** 为单个 tab 设置精灵图状态 */
  function setTabSprite(tab, state) {
    tab.style.backgroundImage = SPRITES[state];
  }

  /** 刷新所有 tab 的背景精灵图 */
  function refreshSprites() {
    discordTabs.forEach(function (t) {
      if (t.classList.contains('active')) {
        setTabSprite(t, 'set');
      } else {
        setTabSprite(t, 'normal');
      }
    });
  }

  function activateDiscord(idx) {
    currentTab = idx;
    discordTabs.forEach(function (t) {
      t.classList.toggle('active', Number(t.dataset.tab) === idx);
    });
    refreshSprites();

    medias.forEach(function (m, i) {
      var active = (i + 1) === idx;
      m.classList.toggle('active', active);
      if (m.tagName === 'VIDEO') {
        if (active && mediaInView) {
          m.play().catch(function () {});
        } else {
          m.pause();
        }
      }
    });
  }

  discordTabs.forEach(function (t) {
    t.addEventListener('click', function () {
      activateDiscord(Number(t.dataset.tab));
    });

    // hover 态：仅对非 active tab 生效
    t.addEventListener('mouseenter', function () {
      if (!t.classList.contains('active')) {
        setTabSprite(t, 'hover');
      }
    });
    t.addEventListener('mouseleave', function () {
      if (!t.classList.contains('active')) {
        setTabSprite(t, 'normal');
      }
    });

    // press 态
    t.addEventListener('mousedown', function () {
      if (!t.classList.contains('active')) {
        setTabSprite(t, 'press');
      }
    });
    t.addEventListener('mouseup', function () {
      if (!t.classList.contains('active')) {
        setTabSprite(t, 'hover');
      }
    });
  });
  activateDiscord(1);

  /* --------------------------------------------------------
   * 2.1) 01 模块 5-tab 切换（HTML + CSS，非切图）
   *      仅做按钮高亮 + 胶囊滑动，不覆盖底图原文案
   * ------------------------------------------------------ */
  const m1Tabs = document.querySelectorAll('.mod1-tab');
  const m1Pill = document.querySelector('.mod1-pill');
  function activateMod1(idx) {
    m1Tabs.forEach((t) => t.classList.toggle('active', Number(t.dataset.m1) === idx));
    if (m1Pill) {
      // 5 等分平移：胶囊宽 = (100% - 20px) / 5，正好一格
      m1Pill.style.transform = 'translateX(' + ((idx - 1) * 100) + '%)';
    }
  }
  m1Tabs.forEach((t) => {
    t.addEventListener('click', () => activateMod1(Number(t.dataset.m1)));
  });
  activateMod1(1);

  /* --------------------------------------------------------
   * 2.2) 03 模块 4-tab 切换（HTML 文字 + CSS，可点击切换）
   *      active tab 下方插入内容面板，其他 tab 顺次下移
   *      普通 tab 间距 72px，active 占用 296px（含内容面板）
   * ------------------------------------------------------ */
  const m3Tabs = document.querySelectorAll('.mod3-tab');
  const m3Pill = document.querySelector('.mod3-pill');
  const m3Panel = document.getElementById('mod3Panel');
  const m3PanelTitle = m3Panel ? m3Panel.querySelector('.mod3-panel-title') : null;
  const m3PanelDesc = m3Panel ? m3Panel.querySelector('.mod3-panel-desc') : null;
  const m3PanelList = m3Panel ? m3Panel.querySelector('.mod3-panel-list') : null;

  // 4 套内容文案（tab3 为 Figma 原文）
  const m3Contents = {
    1: {
      title: '直播间掉宝互动奖励',
      desc: '基于主流直播平台开放能力，打造观看即有奖的实时掉宝互动体系。',
      list: [
        '观众实时观看即可获得游戏道具',
        '奖励可配置，精准触达目标用户',
        '提升直播观看时长与留存'
      ]
    },
    2: {
      title: '主播专属互动挂件',
      desc: '为主播量身打造直播间互动挂件工具，让观众通过弹幕、礼物参与游戏任务。',
      list: [
        '多样挂件模板快速接入',
        '弹幕 / 礼物实时驱动游戏内事件',
        '强化观众代入感与主播影响力'
      ]
    },
    3: {
      title: '玩家与主播互动挑战',
      desc: '基于 Twitch Extension 等能力，开发 Streamer Challenge 等玩家与主播的互动挑战任务。',
      list: [
        '主播与玩家联动，提升直播互动深度',
        'Player / Streamer Challenge 双轨并行',
        '任务奖励机制驱动持续参与'
      ]
    },
    4: {
      title: '更多直播运营能力',
      desc: '围绕 Twitch、YouTube、Discord 等平台持续拓展直播运营与主播互动的更多解决方案。',
      list: [
        '多平台一体化直播运营',
        '数据驱动的主播/观众分层运营',
        '持续迭代的新玩法与新能力'
      ]
    }
  };

  // tab 位置映射：key 为 activeIdx，value 为 4 个 tab 的 top 数组
  // 规则：普通间距 72，active 额外占用 224（内容面板）。所以 active 后下一个 tab 比正常多 +224
  const m3Layout = {
    1: { tops: [0, 296, 368, 440], panelTop: 72 },
    2: { tops: [0, 72, 368, 440], panelTop: 144 },
    3: { tops: [0, 72, 142, 438], panelTop: 214 },
    4: { tops: [0, 72, 142, 214], panelTop: 286 }
  };

  function activateMod3(idx) {
    const cfg = m3Layout[idx];
    if (!cfg) return;

    // 切 tab active
    m3Tabs.forEach((t) => {
      const i = Number(t.dataset.m3);
      t.classList.toggle('active', i === idx);
      if (cfg.tops[i - 1] !== undefined) {
        t.style.top = cfg.tops[i - 1] + 'px';
      }
    });

    // 胶囊跟着 active tab 移动
    if (m3Pill) {
      m3Pill.style.top = cfg.tops[idx - 1] + 'px';
    }

    // 更新内容面板位置与文案
    if (m3Panel && m3PanelTitle && m3PanelDesc && m3PanelList) {
      m3Panel.style.top = cfg.panelTop + 'px';
      const c = m3Contents[idx];
      m3PanelTitle.textContent = c.title;
      m3PanelDesc.textContent = c.desc;
      m3PanelList.innerHTML = c.list.map((t) => `<li>${t}</li>`).join('');
    }
  }
  m3Tabs.forEach((t) => {
    t.addEventListener('click', () => activateMod3(Number(t.dataset.m3)));
  });
  activateMod3(3);  // 默认 tab 3 active

  const mediaPanel = document.getElementById('discord-media');
  if (mediaPanel) {
    const mediaIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          mediaInView = e.isIntersecting;
          const activeVideo = mediaPanel.querySelector('.m.active');
          if (!activeVideo) return;
          if (e.isIntersecting) {
            activeVideo.play().catch(() => {});
          } else {
            medias.forEach((m) => { if (m.tagName === 'VIDEO') m.pause(); });
          }
        });
      },
      { threshold: 0.25 }
    );
    mediaIO.observe(mediaPanel);
  }

  /* --------------------------------------------------------
   * 3) 顶部导航：点击滚动 + 高亮联动
   * ------------------------------------------------------ */
  const navTabs = document.querySelectorAll('.nav-tab');
  function scrollToSection(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const scale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--scale')) || 1;
    const stageTop = viewport.getBoundingClientRect().top + window.scrollY;
    const topbarH = 71 * scale;
    // 再留 20px 呼吸余量
    const targetY = stageTop + (el.offsetTop * scale) - topbarH - 20;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  }
  navTabs.forEach((tab) => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      scrollToSection(tab.dataset.target);
      navTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  const sectionMap = [
    { id: 'sec-1', tab: navTabs[0] },
    { id: 'sec-2', tab: navTabs[1] },
    { id: 'sec-3', tab: navTabs[2] },
    { id: 'sec-4', tab: navTabs[3] }
  ];
  function updateNavActive() {
    const scrollMid = window.scrollY + window.innerHeight * 0.35;
    const scale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--scale')) || 1;
    const stageTop = viewport.getBoundingClientRect().top + window.scrollY;
    let activeIdx = -1;
    sectionMap.forEach((s, i) => {
      const el = document.getElementById(s.id);
      if (!el) return;
      const y = stageTop + el.offsetTop * scale;
      if (scrollMid >= y) activeIdx = i;
    });
    navTabs.forEach((t, i) => t.classList.toggle('active', i === activeIdx));
  }
  window.addEventListener('scroll', updateNavActive, { passive: true });
  window.addEventListener('resize', updateNavActive);
  updateNavActive();

  /* --------------------------------------------------------
   * 4) 滚动渐变进场：支持多方向 fx + stagger
   *    元素只要进入视口就 add('in')，离开视口 remove('in') 实现来回触发
   * ------------------------------------------------------ */
  const revealIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        const el = e.target;
        if (e.isIntersecting) {
          // 延迟：按同类元素中出现次序 stagger 80ms
          const delay = Number(el.dataset._delay || 0);
          el.style.transitionDelay = delay + 'ms';
          el.classList.add('in');
        } else {
          // 向上/向下滚出时都恢复，做"来回"渐变
          // 仅在离开较远时重置，避免边缘抖动
          const rect = el.getBoundingClientRect();
          if (rect.top > window.innerHeight + 120 || rect.bottom < -120) {
            el.classList.remove('in');
          }
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
  );

  // 为同组元素添加 stagger 延迟
  const groups = [
    document.querySelectorAll('.game-hit'),
    document.querySelectorAll('.social-hit .sp'),
  ];
  groups.forEach((list) => {
    list.forEach((el, i) => {
      el.dataset._delay = String(Math.min(i * 60, 360));
    });
  });
  document.querySelectorAll('.reveal').forEach((el) => revealIO.observe(el));

  /* --------------------------------------------------------
   * 4.05) 数字滚动动画
   *       当 #stats-group 进入视口时，数字从 0 滚动到目标值
   * ------------------------------------------------------ */
  const statsGroup = document.getElementById('stats-group');
  let statsAnimated = false;

  function animateNumber(el, target, duration) {
    const start = performance.now();
    const end = start + duration;
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      // easeOutExpo 缓动：快速到达然后减速
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      el.textContent = String(current);
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }
    requestAnimationFrame(tick);
  }

  function triggerStatsAnimation() {
    if (statsAnimated) return;
    statsAnimated = true;
    const nums = statsGroup.querySelectorAll('.stat-num');
    nums.forEach((num, i) => {
      const target = parseInt(num.dataset.target, 10);
      // 各数字依次延迟 150ms 开始滚动
      setTimeout(() => {
        animateNumber(num, target, 1200);
      }, i * 150);
    });
  }

  // 用 IntersectionObserver 监听数字组进入视口
  if (statsGroup) {
    const statsIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            triggerStatsAnimation();
          } else {
            // 离开较远时重置，允许再次触发
            const rect = e.target.getBoundingClientRect();
            if (rect.top > window.innerHeight + 200 || rect.bottom < -200) {
              statsAnimated = false;
              const nums = statsGroup.querySelectorAll('.stat-num');
              nums.forEach((num) => { num.textContent = '0'; });
            }
          }
        });
      },
      { threshold: 0.3 }
    );
    statsIO.observe(statsGroup);
  }

  /* --------------------------------------------------------
   * 4.1) 底图分段 opacity 渐入
   *      每个 .base-seg.scroll-reveal 进入视口时加 .in，
   *      底图对应 y 区间从透明到不透明自然渐入
   *      ⚠️ 关键：必须等 full-frame.png 加载完毕再开启观察，
   *      否则滚动到某段时图片尚未到位，会出现空白。
   * ------------------------------------------------------ */
  const segIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        const el = e.target;
        if (e.isIntersecting) {
          el.classList.add('in');
        } else {
          const rect = el.getBoundingClientRect();
          // 完全离开视口较远时重置，回滚再次触发
          if (rect.bottom < -200 || rect.top > window.innerHeight + 200) {
            el.classList.remove('in');
          }
        }
      });
    },
    { threshold: 0, rootMargin: '200px 0px 0px 0px' }
  );
  // 等底图大图加载完再开始观察分段 —— 此前分段保持 opacity:0，
  // 避免图片未到位就开始动画，导致视觉上的"割裂/跳变"
  criticalImageReady.then(() => {
    document.querySelectorAll('.base-seg.scroll-reveal').forEach((el) => segIO.observe(el));
  });
})();

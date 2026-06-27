/**
 * 生活部文化有限公司 — 全局小组件
 * 滚动进度条 + 回到顶部
 */
(function () {
  'use strict';

  // ============ 注入 DOM ============
  var bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.appendChild(bar);

  var btn = document.createElement('div');
  btn.className = 'back-to-top';
  btn.innerHTML = '↑';
  btn.title = '回到顶部';
  document.body.appendChild(btn);

  // ============ 滚动进度条 ============
  function updateProgress() {
    var scrollTop = window.scrollY || document.documentElement.scrollTop;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var pct = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0;
    bar.style.width = pct + '%';
  }

  // ============ 回到顶部 ============
  function toggleButton() {
    var scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop > 400) {
      btn.classList.add('show');
    } else {
      btn.classList.remove('show');
    }
  }

  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ============ 监听 ============
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(function () {
        updateProgress();
        toggleButton();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // 初始执行
  updateProgress();
  toggleButton();
})();

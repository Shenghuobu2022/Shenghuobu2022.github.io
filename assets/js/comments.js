/**
 * 生活部文化有限公司 — 留言板（Supabase 后端）
 * 使用前需替换下方的 SUPABASE_URL 和 SUPABASE_KEY
 */
(function () {
  'use strict';

  // ======== ⚠️ 替换为你自己的 Supabase 配置 ========
  var SUPABASE_URL = 'https://xpjscwinakuifoounjdp.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_F1JEY_RaNdI1Zkqwh_Fg0Q_dcEnfdTs';
  // =================================================

  var page = location.pathname.split('/').pop() || '';
  var client = null;
  var RATE_LIMIT = 30000; // 30 秒冷却

  // 暂停提示信息
  var PAUSED_MSG =
    '<div class="comment-empty" style="color:var(--accent);font-size:0.9rem;line-height:1.8;">' +
      '💤 留言板已休眠<br>' +
      '<span style="font-size:0.78rem;color:var(--text-dim);">长时间未访问，请 <strong style="color:var(--accent);">@冰狗</strong> 处理<br>' +
      '登录 <a href="https://supabase.com/dashboard/project/xpjscwinakuifoounjdp" target="_blank" style="color:var(--accent);text-decoration:underline;">Supabase 控制台</a> 点击 <strong style="color:var(--accent);">Resume</strong> 恢复项目</span>' +
    '</div>';

  // 频率限制提示
  var RATE_MSG = '<div class="comment-empty" style="color:var(--accent);">⏳ 发送太快啦，请 30 秒后再试</div>';

  // ============ 加载 Supabase CDN ============
  function loadSupabase(cb) {
    // 国内 jsdelivr 不稳定，尝试 fastly 线路
    var urls = [
      'https://fastly.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js',
      'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js'
    ];
    var idx = 0;

    function tryLoad() {
      if (idx >= urls.length) {
        var list = document.getElementById('comment-list');
        if (list) list.innerHTML = '<div class="comment-empty">留言板加载失败，请检查网络后刷新页面</div>';
        cb();
        return;
      }
      var script = document.createElement('script');
      script.src = urls[idx];
      script.onload = function () {
        var s = window.supabase || self.supabase || (typeof supabase !== 'undefined' ? supabase : null);
        if (s) {
          client = s.createClient(SUPABASE_URL, SUPABASE_KEY);
        }
        cb();
      };
      script.onerror = function () {
        idx++;
        tryLoad();
      };
      document.head.appendChild(script);
    }
    tryLoad();
  }

  // ============ 注入留言板 DOM ============
  function injectCommentSection() {
    var container = document.querySelector('.page-container');
    if (!container) return;

    var div = document.createElement('div');
    div.className = 'comment-section';
    div.innerHTML =
      '<div class="comment-title">💬 留言板</div>' +
      '<div class="comment-form">' +
        '<div class="comment-row">' +
          '<input type="text" id="comment-name" placeholder="你的名字（选填）" maxlength="30" autocomplete="off">' +
        '</div>' +
        '<textarea id="comment-text" placeholder="说点什么吧..." maxlength="500"></textarea>' +
        '<button class="comment-submit" id="comment-submit">发送留言</button>' +
      '</div>' +
      '<div class="comment-list" id="comment-list">' +
        '<div class="comment-empty">加载中...</div>' +
      '</div>';

    container.appendChild(div);
  }

  // ============ 加载留言列表 ============
  function loadComments() {
    if (!client) return;
    var list = document.getElementById('comment-list');
    if (!list) return;

    client.from('comments')
      .select('*')
      .eq('page', page)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(function (res) {
        if (res.error) {
          list.innerHTML = isPaused(res.error) ? PAUSED_MSG : '<div class="comment-empty">加载失败，请稍后重试</div>';
          return;
        }
        if (!res.data || res.data.length === 0) {
          list.innerHTML = '<div class="comment-empty">暂无留言，来说第一句吧 💬</div>';
          return;
        }

        var html = '';
        res.data.forEach(function (c) {
          var name = c.name || '匿名同学';
          var date = new Date(c.created_at);
          var time = date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate() + ' ' +
            pad(date.getHours()) + ':' + pad(date.getMinutes());
          html +=
            '<div class="comment-item">' +
              '<div class="comment-meta">' +
                '<span class="comment-author">' + esc(name) + '</span>' +
                '<span class="comment-time">' + esc(time) + '</span>' +
              '</div>' +
              '<div class="comment-body">' + esc(c.content) + '</div>' +
            '</div>';
        });
        list.innerHTML = html;
      })
      .catch(function (err) {
        list.innerHTML = isPaused(err) ? PAUSED_MSG : '<div class="comment-empty">加载失败，请稍后重试</div>';
      });
  }

  function esc(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function pad(n) { return ('0' + n).slice(-2); }

  // 判断是否为 Supabase 项目暂停（503 / 无法连接 / project not found）
  function isPaused(err) {
    if (!err) return false;
    var m = (err.message || '').toLowerCase();
    var c = (err.code || '').toString();
    return (
      c === '503' || c === '502' ||
      m.indexOf('service unavailable') !== -1 ||
      m.indexOf('project') !== -1 ||
      m.indexOf('deactivated') !== -1 ||
      m.indexOf('paused') !== -1 ||
      m.indexOf('fetch') !== -1
    );
  }

  // ============ 发送留言 ============
  function setupForm() {
    var btn = document.getElementById('comment-submit');
    var nameInp = document.getElementById('comment-name');
    var textInp = document.getElementById('comment-text');
    if (!btn || !textInp) return;

    btn.addEventListener('click', function () {
      var name = (nameInp.value || '').trim();
      var text = textInp.value.trim();
      if (!text) return;
      if (text.length > 500) { alert('留言太长了，最多 500 字'); return; }

      // 频率限制
      var rateKey = 'shb_cmt_ts_' + page;
      var last = localStorage.getItem(rateKey);
      var now = Date.now();
      if (last && (now - parseInt(last, 10)) < RATE_LIMIT) {
        var left = Math.ceil((RATE_LIMIT - (now - parseInt(last, 10))) / 1000);
        alert('发太快啦，请 ' + left + ' 秒后再试');
        return;
      }

      btn.disabled = true;
      btn.textContent = '发送中...';

      client.from('comments')
        .insert([{ page: page, name: name || null, content: text }])
        .then(function (res) {
          if (res.error) {
            if (isPaused(res.error)) {
              var list = document.getElementById('comment-list');
              if (list) list.innerHTML = PAUSED_MSG;
            }
            btn.disabled = false;
            btn.textContent = '发送失败，重试';
            return;
          }
          nameInp.value = '';
          textInp.value = '';
          btn.disabled = false;
          btn.textContent = '发送留言';
          localStorage.setItem('shb_cmt_ts_' + page, Date.now().toString());
          loadComments();
        })
        .catch(function (err) {
          if (isPaused(err)) {
            var list = document.getElementById('comment-list');
            if (list) list.innerHTML = PAUSED_MSG;
          }
          btn.disabled = false;
          btn.textContent = '发送失败，重试';
        });
    });
  }

  injectCommentSection();
  loadSupabase(function () {
    setupForm();
    loadComments();
  });
})();

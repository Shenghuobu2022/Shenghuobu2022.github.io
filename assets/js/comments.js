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

  // ============ 加载留言列表（B站风格分页 + 楼中楼）============
  var PAGE_SIZE = 5; // 每页主楼条数
  var currentPage = 1;
  var expandedReplies = {}; // 已展开回复的主楼 ID 集合
  var allTopLevel = [];
  var allReplies = {};

  // 删除密码（SHA-256 哈希，源码不可见原始密码）
  var DELETE_PW_HASH = 'f933ceafed37def75235ec78c4d94f6a1b6448cd4c22b67a0c9dee800c8c4e93';

  function loadComments() {
    if (!client) return;
    var list = document.getElementById('comment-list');
    if (!list) return;

    client.from('comments')
      .select('*')
      .eq('page', page)
      .order('created_at', { ascending: true })
      .limit(200)
      .then(function (res) {
        if (res.error) {
          list.innerHTML = isPaused(res.error) ? PAUSED_MSG : '<div class="comment-empty">加载失败，请稍后重试</div>';
          return;
        }
        if (!res.data || res.data.length === 0) {
          list.innerHTML = '<div class="comment-empty">暂无留言，来说第一句吧 💬</div>';
          return;
        }

        // 拆分为主楼和回复
        allTopLevel = [];
        allReplies = {};
        res.data.forEach(function (c) {
          if (!c.parent_id) {
            allTopLevel.push(c);
          } else {
            if (!allReplies[c.parent_id]) allReplies[c.parent_id] = [];
            allReplies[c.parent_id].push(c);
          }
        });
        // 最新优先
        allTopLevel.reverse();

        renderList(list, 1);
      })
      .catch(function (err) {
        list.innerHTML = isPaused(err) ? PAUSED_MSG : '<div class="comment-empty">加载失败，请稍后重试</div>';
      });
  }

  function renderList(list, pageNum) {
    var totalPages = Math.ceil(allTopLevel.length / PAGE_SIZE) || 1;
    if (pageNum < 1) pageNum = 1;
    if (pageNum > totalPages) pageNum = totalPages;
    currentPage = pageNum;

    var start = (pageNum - 1) * PAGE_SIZE;
    var end = Math.min(start + PAGE_SIZE, allTopLevel.length);
    var html = '';

    for (var i = start; i < end; i++) {
      var c = allTopLevel[i];
      html += renderComment(c, false, c.id);
      var children = allReplies[c.id] || [];
      if (children.length > 0) {
        if (expandedReplies[c.id]) {
          // 已展开：显示全部回复 + 底部收起按钮
          children.forEach(function (child) {
            html += renderComment(child, true, c.id);
          });
          html += '<div class="comment-replies-collapse" data-collapse="' + c.id + '">收起回复 ▲</div>';
        } else {
          // 折叠：显示展开按钮
          html += '<div class="comment-replies-toggle" data-expand="' + c.id + '">' +
            '共 <strong>' + children.length + '</strong> 条回复 ▼</div>';
        }
      }
    }

    // 页码导航
    if (totalPages > 1) {
      html += '<div class="comment-pager">';
      for (var p = 1; p <= totalPages; p++) {
        var cls = p === currentPage ? ' comment-page-btn active' : 'comment-page-btn';
        html += '<button class="' + cls + '" data-page="' + p + '">' + p + '</button>';
      }
      html += '</div>';
    }

    list.innerHTML = html;
  }

  function renderComment(c, isReply, topId) {
    var cls = isReply ? 'comment-item comment-reply' : 'comment-item';
    var name = c.name || '匿名同学';
    var date = new Date(c.created_at);
    var time = date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate() + ' ' +
      pad(date.getHours()) + ':' + pad(date.getMinutes());
    return '<div class="' + cls + '" data-id="' + c.id + '" data-top="' + topId + '" data-name="' + esc(name) + '">' +
      '<div class="comment-meta">' +
        '<span class="comment-author">' + esc(name) + '</span>' +
        '<span class="comment-time">' + esc(time) + '</span>' +
      '</div>' +
      '<div class="comment-body">' + formatBody(c.content, isReply) + '</div>' +
      '<button class="comment-reply-btn" data-reply="' + c.id + '">回复</button>' +
      '<button class="comment-delete-btn" data-delete="' + c.id + '">删除</button>' +
      '<div class="comment-reply-form" id="reply-form-' + c.id + '" style="display:none;">' +
        '<div class="reply-to-tag" style="display:none;">回复 <strong class="reply-to-name"></strong><span class="reply-to-close">✕</span></div>' +
        '<input type="text" class="reply-name" placeholder="你的名字（选填）" maxlength="30">' +
        '<textarea class="reply-text" placeholder="回复..." maxlength="500"></textarea>' +
        '<div class="reply-btns">' +
          '<button class="reply-submit">回复</button>' +
          '<button class="reply-cancel">取消</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function esc(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // 楼中楼回复高亮 @名字 前缀
  function formatBody(content, isReply) {
    if (!isReply) return esc(content);
    var m = content.match(/^@(\S+)\s/);
    if (m) {
      return '<span class="comment-mention">@' + esc(m[1]) + '</span> ' + esc(content.slice(m[0].length));
    }
    return esc(content);
  }

  function pad(n) { return ('0' + n).slice(-2); }

  // SHA-256 哈希（用于删除密码验证）
  function sha256(str) {
    var encoder = new TextEncoder();
    var data = encoder.encode(str);
    return crypto.subtle.digest('SHA-256', data).then(function (hashBuffer) {
      var hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    });
  }

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

  // ============ 发送留言 + 回复（事件委托）============
  function setupForm() {
    var submitBtn = document.getElementById('comment-submit');
    var nameInp = document.getElementById('comment-name');
    var textInp = document.getElementById('comment-text');

    // 顶层留言
    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        var name = (nameInp.value || '').trim();
        var text = textInp.value.trim();
        if (!text) return;
        if (text.length > 500) { alert('留言太长了，最多 500 字'); return; }

        if (!checkRate()) return;

        submitBtn.disabled = true;
        submitBtn.textContent = '发送中...';

        doInsert({ page: page, name: name || null, content: text }, function (newRow) {
          nameInp.value = '';
          textInp.value = '';
          submitBtn.disabled = false;
          submitBtn.textContent = '发送留言';
          if (newRow) {
            allTopLevel.unshift(newRow);
            renderList(list, 1);
          }
        }, function () {
          submitBtn.disabled = false;
          submitBtn.textContent = '发送失败，重试';
        });
      });
    }

    // 回复按钮：事件委托在留言列表上
    var list = document.getElementById('comment-list');
    if (list) {
      list.addEventListener('click', function (e) {
        var target = e.target;

        // 点击「回复」按钮 — 先收起其他，再展开当前
        if (target.classList.contains('comment-reply-btn')) {
          var replyId = target.getAttribute('data-reply');
          // 收起所有回复框
          var allForms = list.querySelectorAll('.comment-reply-form');
          allForms.forEach(function (f) { f.style.display = 'none'; });
          // 展开当前
          var form = document.getElementById('reply-form-' + replyId);
          if (form) {
            form.style.display = 'flex';
            // 回复楼中楼时显示 @名字 标签
            var item = target.closest('.comment-item');
            var tag = form.querySelector('.reply-to-tag');
            var tagName = form.querySelector('.reply-to-name');
            var txt = form.querySelector('.reply-text');
            if (item && item.classList.contains('comment-reply') && tag && tagName) {
              tagName.textContent = '@' + (item.getAttribute('data-name') || '');
              tag.style.display = 'flex';
              tag.setAttribute('data-reply-to', item.getAttribute('data-id') || '');
            } else if (tag) {
              tag.style.display = 'none';
              tag.removeAttribute('data-reply-to');
            }
            // 每次展开都清空之前的输入
            if (txt) txt.value = '';
            var nameInp = form.querySelector('.reply-name');
            if (nameInp) nameInp.value = '';
            form.querySelector('.reply-text').focus();
          }
        }

        // 点击 @标签上的 ✕ → 还原为回复主楼
        if (target.classList.contains('reply-to-close')) {
          var tag = target.closest('.reply-to-tag');
          if (tag) {
            tag.style.display = 'none';
            tag.removeAttribute('data-reply-to');
          }
        }

        // 点击「取消」
        if (target.classList.contains('reply-cancel')) {
          var form = target.closest('.comment-reply-form');
          if (form) form.style.display = 'none';
        }

        // 点击页码 → 翻页
        if (target.classList.contains('comment-page-btn')) {
          var p = parseInt(target.getAttribute('data-page'), 10);
          if (p) renderList(list, p);
          return;
        }

        // 点击「共 X 条回复」→ 展开回复
        if (target.closest('.comment-replies-toggle')) {
          var btn = target.closest('.comment-replies-toggle');
          var expandId = btn.getAttribute('data-expand');
          expandedReplies[expandId] = true;
          renderList(list, currentPage);
          return;
        }

        // 点击「收起回复」→ 折叠回复
        if (target.closest('.comment-replies-collapse')) {
          var btn = target.closest('.comment-replies-collapse');
          var collapseId = btn.getAttribute('data-collapse');
          expandedReplies[collapseId] = false;
          renderList(list, currentPage);
          return;
        }

        // 点击「删除」
        if (target.classList.contains('comment-delete-btn')) {
          var delId = target.getAttribute('data-delete');
          var pw = prompt('请输入删除密码：');
          if (!pw) return;
          sha256(pw).then(function (hash) {
            if (hash !== DELETE_PW_HASH) {
              alert('密码错误');
              return;
            }
            if (!confirm('确认删除这条留言？')) return;
            client.from('comments').delete().eq('id', parseInt(delId, 10) || delId).then(function (res) {
              if (res.error) {
                alert('删除失败，请稍后重试');
                return;
              }
              // 从本地数据中移除
              allTopLevel = allTopLevel.filter(function (c) { return String(c.id) !== String(delId); });
              var topId = target.closest('.comment-item').getAttribute('data-top');
              if (topId && allReplies[topId]) {
                allReplies[topId] = allReplies[topId].filter(function (c) { return String(c.id) !== String(delId); });
              }
              // 如果被删的是主楼，同时清理其所有回复
              if (topId === delId) {
                delete allReplies[delId];
                delete expandedReplies[delId];
              }
              renderList(list, currentPage);
            }).catch(function () {
              alert('网络错误，请稍后重试');
            });
          });
          return;
        }

        // 点击「发送回复」
        if (target.classList.contains('reply-submit')) {
          var form = target.closest('.comment-item');
          // 统一挂在主楼下面（data-top），不额外缩进
          var topId = form ? form.getAttribute('data-top') : null;
          if (!topId) return;
          var replyForm = document.getElementById('reply-form-' + form.getAttribute('data-id'));
          if (!replyForm) return;
          var rName = (replyForm.querySelector('.reply-name').value || '').trim();
          var rText = replyForm.querySelector('.reply-text').value.trim();
          // 如果标签可见，自动在内容前加 @名字
          var tag = replyForm.querySelector('.reply-to-tag');
          if (tag && tag.style.display !== 'none') {
            var atWho = tag.querySelector('.reply-to-name').textContent || '';
            if (atWho) rText = atWho + ' ' + rText;
          }
          if (!rText) return;
          if (rText.length > 500) { alert('回复太长了'); return; }

          if (!checkRate()) return;

          target.disabled = true;
          target.textContent = '发送中...';

          doInsert({ page: page, name: rName || null, content: rText, parent_id: parseInt(topId, 10) }, function (newRow) {
            target.disabled = false;
            target.textContent = '回复';
            replyForm.style.display = 'none';
            replyForm.querySelector('.reply-name').value = '';
            replyForm.querySelector('.reply-text').value = '';
            if (newRow) {
              if (!allReplies[topId]) allReplies[topId] = [];
              allReplies[topId].push(newRow);
              // 找到父留言所在页
              var parentIdx = -1;
              for (var i = 0; i < allTopLevel.length; i++) {
                if (String(allTopLevel[i].id) === String(topId)) { parentIdx = i; break; }
              }
              var parentPage = parentIdx >= 0 ? Math.floor(parentIdx / PAGE_SIZE) + 1 : currentPage;
              expandedReplies[topId] = true;
              renderList(list, parentPage);
            }
          }, function () {
            target.disabled = false;
            target.textContent = '发送失败，重试';
          });
        }
      });
    }
  }

  function checkRate() {
    var rateKey = 'shb_cmt_ts_' + page;
    var last = localStorage.getItem(rateKey);
    var now = Date.now();
    if (last && (now - parseInt(last, 10)) < RATE_LIMIT) {
      var left = Math.ceil((RATE_LIMIT - (now - parseInt(last, 10))) / 1000);
      alert('发太快啦，请 ' + left + ' 秒后再试');
      return false;
    }
    return true;
  }

  function doInsert(row, onSuccess, onError) {
    client.from('comments')
      .insert([row])
      .then(function (res) {
        if (res.error) {
          if (isPaused(res.error)) {
            var lst = document.getElementById('comment-list');
            if (lst) lst.innerHTML = PAUSED_MSG;
          }
          onError();
          return;
        }
        localStorage.setItem('shb_cmt_ts_' + page, Date.now().toString());
        // 服务器返回的数据优先，否则用本地参数构建（保证一定有一行可渲染）
        var serverRow = res.data && res.data[0];
        var newRow = serverRow || Object.assign({}, row, {
          id: -Date.now(),
          created_at: new Date().toISOString()
        });
        onSuccess(newRow);
      })
      .catch(function (err) {
        if (isPaused(err)) {
          var lst = document.getElementById('comment-list');
          if (lst) lst.innerHTML = PAUSED_MSG;
        }
        onError();
      });
  }

  injectCommentSection();
  loadSupabase(function () {
    setupForm();
    loadComments();
  });
})();

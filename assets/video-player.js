(function (root) {
  'use strict';

  function createController(video, options) {
    const doc = options.document || root.document;
    const sources = options.sources;
    const notify = options.notify || function () {};
    let state = { phase: 'idle', quality: sources.web ? 'web' : 'original', started: false, error: '' };
    let loadedQuality = null;
    let pendingTime = null;
    let revision = 0;
    let disposed = false;
    const listeners = [];

    function update(patch) {
      state = Object.assign({}, state, patch);
      if (!disposed) notify(Object.assign({}, state));
    }
    function listen(target, name, callback) {
      target.addEventListener(name, callback);
      listeners.push(function () { target.removeEventListener(name, callback); });
    }
    function pauseOthers() {
      doc.querySelectorAll('video').forEach(function (other) {
        if (other !== video && !other.paused) other.pause();
      });
    }
    function loadSource(quality, time, force) {
      if (!force && loadedQuality === quality) return;
      const url = sources[quality];
      if (!url) throw new Error('缺少视频地址');
      revision += 1;
      loadedQuality = quality;
      pendingTime = Number.isFinite(time) && time > 0 ? time : null;
      video.preload = 'auto';
      video.src = url;
      video.load();
    }
    function play() {
      if (disposed) return;
      pauseOthers();
      update({ phase: 'loading', started: true, error: '' });
      try {
        loadSource(state.quality, null, false);
        const current = revision;
        // Keep play() inside the user's click so iOS can authorize playback.
        const promise = video.play();
        if (promise && promise.catch) promise.catch(function (error) {
          if (disposed || current !== revision) return;
          if (error.name === 'AbortError') return;
          if (error.name === 'NotAllowedError') {
            update({ phase: 'paused', error: '' });
          } else {
            update({ phase: 'error', error: '暂时无法播放，请重试或切换画质。' });
          }
        });
      } catch (error) {
        update({ phase: 'error', error: '暂时无法播放，请重试或切换画质。' });
      }
    }
    function selectQuality(quality) {
      if (disposed || !sources[quality] || quality === state.quality) return;
      const resume = !video.paused || state.phase === 'loading';
      const time = pendingTime !== null ? pendingTime : video.currentTime;
      update({ quality: quality, error: '' });
      if (!state.started) return;
      loadSource(quality, time, false);
      if (resume) play();
      else update({ phase: 'paused' });
    }
    function retry() {
      if (disposed) return;
      const time = pendingTime !== null ? pendingTime : video.currentTime;
      loadSource(state.quality, time, true);
      play();
    }

    listen(video, 'loadedmetadata', function () {
      if (pendingTime !== null) {
        const duration = video.duration;
        const time = Number.isFinite(duration) ? Math.min(pendingTime, Math.max(0, duration - 0.05)) : pendingTime;
        pendingTime = null;
        try { video.currentTime = time; } catch (_) {}
      }
    });
    listen(video, 'play', pauseOthers);
    listen(video, 'playing', function () { update({ phase: 'playing', started: true, error: '' }); });
    listen(video, 'waiting', function () { if (state.started && !video.paused) update({ phase: 'loading' }); });
    listen(video, 'pause', function () {
      if (state.started && state.phase !== 'error') update({ phase: video.ended ? 'ended' : 'paused' });
    });
    listen(video, 'ended', function () { update({ phase: 'ended' }); });
    listen(video, 'error', function () {
      if (loadedQuality !== null) update({ phase: 'error', error: '视频加载失败，请重试或切换画质。' });
    });
    listen(doc, 'visibilitychange', function () { if (doc.hidden && !video.paused) video.pause(); });

    return {
      play: play,
      retry: retry,
      selectQuality: selectQuality,
      getState: function () { return Object.assign({}, state); },
      pause: function () { if (!disposed) video.pause(); },
      destroy: function () {
        if (disposed) return;
        disposed = true;
        revision += 1;
        listeners.forEach(function (remove) { remove(); });
        video.pause();
        video.removeAttribute('src');
        video.load();
      }
    };
  }

  function durationLabel(seconds) {
    if (!Number.isFinite(seconds)) return '';
    const value = Math.round(seconds);
    return Math.floor(value / 60) + ':' + String(value % 60).padStart(2, '0');
  }

  function render(React, jsx, props) {
    const media = props.media;
    const cover = !!props.cover;
    const asset = (root.__folioVideoAssets || {})[media.id] || {};
    const original = root.__folioMediaStore && root.__folioMediaStore.original(media) || asset.original;
    const sources = { original: original };
    if (asset.src) sources.web = asset.src;
    const ratio = asset.width && asset.height ? asset.width / asset.height : 16 / 9;
    const videoRef = React.useRef(null);
    const stageRef = React.useRef(null);
    const controllerRef = React.useRef(null);
    const pair = React.useState({ phase: 'idle', quality: sources.web ? 'web' : 'original', started: false, error: '' });
    const state = pair[0];
    const setState = pair[1];
    const h = React.createElement;

    React.useEffect(function () {
      if (props.onBackdrop && asset.poster) props.onBackdrop(asset.poster);
    }, [media.id, asset.poster, props.onBackdrop]);

    React.useEffect(function () {
      if (cover || !videoRef.current) return;
      const video = videoRef.current;
      const controller = createController(video, { sources: sources, notify: setState });
      controllerRef.current = controller;
      setState(controller.getState());
      let observer = null;
      if (typeof root.IntersectionObserver === 'function') {
        observer = new root.IntersectionObserver(function (entries) {
          if (entries.some(function (entry) { return !entry.isIntersecting; }) &&
              !root.document.fullscreenElement && !video.webkitDisplayingFullscreen) controller.pause();
        }, { threshold: 0 });
        if (stageRef.current) observer.observe(stageRef.current);
      }
      return function () {
        if (observer) observer.disconnect();
        controller.destroy();
        if (controllerRef.current === controller) controllerRef.current = null;
      };
    }, [media.id, cover, asset.src, original]);

    const poster = asset.poster ? h('img', {
      className: 'folio-film-poster', src: asset.poster, alt: '',
      loading: 'lazy', decoding: 'async', width: asset.width || 1280, height: asset.height || 720
    }) : h('span', { className: 'folio-film-placeholder', 'aria-hidden': 'true' }, 'FILM');

    // Home covers are images only: scrolling the portfolio never starts a video request.
    if (cover) return h('span', { className: 'media-video media-video-cover folio-film-cover' },
      poster, h('span', { className: 'folio-film-duration' }, durationLabel(asset.duration)));

    const showStart = !state.started || state.phase === 'error';
    const playLabel = state.phase === 'error' ? '重新播放' : '播放影片';
    return h('span', {
      className: 'media-video folio-film' + (ratio < 0.9 ? ' is-portrait' : ''),
      style: { '--film-ratio': String(ratio) }, 'data-playback': state.phase
    },
      h('span', { ref: stageRef, className: 'folio-film-stage' },
        h('video', {
          ref: videoRef, className: 'folio-film-video', preload: 'none', controls: state.started,
          playsInline: true, 'webkit-playsinline': 'true',
          'aria-label': media.name || '作品视频', width: asset.width || 1280, height: asset.height || 720
        }),
        showStart && h('span', { className: 'folio-film-idle' }, poster,
          h('button', {
            type: 'button', className: 'folio-film-start', 'aria-label': playLabel + '：' + media.name,
            onClick: function () {
              if (controllerRef.current) {
                if (state.phase === 'error') controllerRef.current.retry();
                else controllerRef.current.play();
              }
            }
          }, h('span', { className: 'folio-film-play-icon', 'aria-hidden': 'true' }), h('span', null, playLabel))
        ),
        state.phase === 'loading' && h('span', { className: 'folio-film-buffering', role: 'status' },
          h('span', { className: 'folio-film-spinner', 'aria-hidden': 'true' }), '正在缓冲…')
      ),
      h('span', { className: 'folio-film-toolbar' },
        h('span', { className: 'folio-film-time' }, '影片', asset.duration ? ' · ' + durationLabel(asset.duration) : ''),
        h('span', { className: 'folio-film-actions' },
          sources.web && h('label', { className: 'folio-film-quality' }, '画质',
            h('select', {
              value: state.quality, 'aria-label': '视频画质',
              onChange: function (event) { if (controllerRef.current) controllerRef.current.selectQuality(event.target.value); }
            }, h('option', { value: 'web' }, '流畅'), h('option', { value: 'original' }, '原画'))),
          original && h('a', { className: 'folio-film-download', href: original, download: media.name }, '下载原片')
        )
      ),
      state.error && h('span', { className: 'folio-film-error', role: 'alert' }, state.error)
    );
  }

  const api = { createController: createController, durationLabel: durationLabel, render: render };
  root.FolioVideo = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window === 'object' ? window : globalThis);

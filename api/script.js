export default function handler(req, res) {
  // 允许洛雪跨域读取，并声明这是个合法的 JS 脚本
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');

  const scriptContent = `/**
 * @name 我的独立云端音源
 * @description 100%纯云端·直接调用私人后端
 * @version 1.0.30
 * @author 洛雪科技＆玥然OvO
 */

// 🎯 这里已经死死绑定了你自己的私有后端域名！
const API_URL = "https://88.lxmusic.zhaoxin.cc.cd";
const API_KEY = "lxmusic";

const MUSIC_QUALITY = {
  kw: ['128k', '320k', 'flac'],
  kg: ['128k', '320k', 'flac'],
  tx: ['128k', '320k', 'flac'],
  wy: ['128k', '320k', 'flac'],
  mg: ['128k', '320k', 'flac']
};
const MUSIC_SOURCE = Object.keys(MUSIC_QUALITY);

const httpFetch = (url, options = { method: 'GET' }) => {
  if (!url.startsWith('http')) {
    url = \`\${API_URL}\${url}\`;
  }
  return new Promise((resolve, reject) => {
    globalThis.lx.request(url, {
      method: options.method || 'GET',
      headers: { 
        'accept': 'application/json', 
        'x-request-key': API_KEY, 
        'user-agent': 'lx-music-request/2.0.0' 
      }
    }, (err, resp, body) => {
      if (err) return reject(err);
      const statusCode = resp ? (resp.statusCode || resp.status || 200) : 200;
      resolve({ statusCode, body: body || (resp ? resp.body : null) });
    });
  });
};

const handleGetMusicUrl = async (source, musicInfo, quality) => {
  const songId = musicInfo.hash ?? musicInfo.songmid;
  const response = await httpFetch(\`/lxmusicv4/url/\${source}/\${songId}/\${quality}\`);
  const { body, statusCode } = response;
  if (statusCode >= 400) throw new Error(\`中转站异常 (\${statusCode})\`);
  const data = typeof body === 'string' ? JSON.parse(body) : body;
  if (data && (data.code === 0 || data.code === 200)) return data.data || data.url;
  throw new Error(data?.msg || '响应空数据');
};

const musicSources = {};
MUSIC_SOURCE.forEach(item => { musicSources[item] = { name: item, type: 'music', actions: ['musicUrl'], qualitys: MUSIC_QUALITY[item] }; });

globalThis.lx.on(globalThis.lx.EVENT_NAMES.request, ({ action, source, info }) => {
  if (action === 'musicUrl') return handleGetMusicUrl(source, info.musicInfo, info.type).then(data => Promise.resolve(data)).catch(err => Promise.reject(err));
  return Promise.reject('action not support');
});

globalThis.lx.send(globalThis.lx.EVENT_NAMES.inited, { status: true, openDevTools: false, sources: musicSources });`;

  res.status(200).send(scriptContent);
}

// api/index.js
// 终极双保险接口版：内置双通道，自动重试，严丝合缝
const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { source, mid, type } = req.query;

  if (!source || !mid) {
    return res.status(200).json({ code: 0, status: "ok", msg: "网关就绪" });
  }

  // 两个备用接口通道
  const apis = [
    `https://music.liuzhiting.cn/api/url/${source}/${mid}/${type}`,
    `https://music-dl.sayqz.com/api/url/${source}/${mid}/${type}`
  ];

  // 定义请求函数
  const fetchUrl = (url) => {
    return new Promise((resolve) => {
      https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 5000 }, (resp) => {
        let data = '';
        resp.on('data', (chunk) => { data += chunk; });
        resp.on('end', () => { resolve(data); });
      }).on('error', () => resolve(null)).setTimeout(5000, function() { this.destroy(); resolve(null); });
    });
  };

  // 尝试第一个，不行就试第二个
  for (const url of apis) {
    const body = await fetchUrl(url);
    if (body) {
      try {
        const result = JSON.parse(body);
        let finalUrl = result.data?.url || result.data || result.url;
        if (finalUrl && typeof finalUrl === 'string') {
          return res.status(200).json({ code: 0, msg: "success", data: finalUrl });
        }
      } catch (e) {}
    }
  }

  return res.status(200).json({ code: 1, msg: "所有上游接口均无响应" });
};

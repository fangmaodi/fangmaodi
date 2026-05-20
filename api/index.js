const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { source, mid, type } = req.query;

  if (!source || !mid) return res.status(200).json({ code: 0, status: "ok", msg: "网关就绪" });

  // 使用一个当前最活跃的备用接口
  const targetUrl = `https://api.sonimei.cn/?types=url&id=${mid}&source=${source}`;

  https.get(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (resp) => {
    let data = '';
    resp.on('data', (c) => data += c);
    resp.on('end', () => {
      try {
        const json = JSON.parse(data);
        // 此接口结构简单，直接提取 url
        if (json.url) {
          return res.status(200).json({ code: 0, msg: "success", data: json.url });
        }
        throw new Error("无数据");
      } catch (e) {
        return res.status(200).json({ code: 1, msg: "解析失败，请检查歌曲是否下架" });
      }
    });
  }).on('error', () => {
    return res.status(200).json({ code: 1, msg: "接口请求超时" });
  });
};

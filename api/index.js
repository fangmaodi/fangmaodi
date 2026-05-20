// api/index.js
// 完美匹配洛雪前端发来的 `/lxmusicv4/url/:source/:id/:quality` 路由
module.exports = async (req, res) => {
  // 允许跨域
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-request-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. 自动兼容两种前端传参模式（URL 路径参数 或 Query 问号传参）
  const urlPath = req.url.split('?')[0];
  let source, mid, type;

  if (urlPath.includes('/lxmusicv4/url/')) {
    // 路径解析模式: /lxmusicv4/url/kw/123456/flac
    const parts = urlPath.split('/').filter(Boolean);
    source = parts[2];
    mid = parts[3];
    type = parts[4];
  } else {
    // Query 参数模式: ?source=kw&mid=123456&type=flac
    source = req.query.source;
    mid = req.query.mid;
    type = req.query.type;
  }

  // 2. 如果是洛雪初始化的测试请求，直接返回 status: ok 激活绿灯
  if (!source || !mid) {
    return res.status(200).json({
      code: 0,
      status: "ok",
      msg: "我的Vercel中转站连接成功！"
    });
  }

  try {
    // 3. 【核心业务】向星海/溯音等公开可用接口发起上游解析（这里以全豆要聚合的通用网关为例）
    // 您也可以在此处替换为您知道的任何有效底层直链解析接口
    const targetApi = `https://music-dl.sayqz.com/api/url/${source}/${mid}/${type}`;
    
    const response = await fetch(targetApi, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const result = await response.json();

    // 4. 将上游获取到的真实歌曲直链，原封不动按洛雪要求的格式吐回给手机端
    if (result && (result.code === 0 || result.url)) {
      return res.status(200).json({
        code: 0,
        msg: "success",
        data: result.url || result.data
      });
    }

    return res.status(200).json({ code: 1, msg: "上游接口解析失败，请尝试切换音质或歌曲" });

  } catch (error) {
    return res.status(200).json({ code: 1, msg: `服务器内部错误: ${error.message}` });
  }
};

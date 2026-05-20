// api/index.js
// 针对 Vercel 500 崩溃全面优化的安全版后端
module.exports = async (req, res) => {
  // 1. 强制注入全套跨域头，确保客户端能收到任何状态码
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { source, mid, type } = req.query;

  // 2. 浏览器访问或洛雪测试连通性，立刻秒回 200，保证不崩
  if (!source || !mid) {
    return res.status(200).json({
      code: 0,
      status: "ok",
      msg: "我的Vercel中转站已经100%完美连通！"
    });
  }

  // 3. 安全沙箱：用 try-catch 死死护住函数，哪怕上游挂了也绝不报 500
  try {
    // 💡 核心对齐：提取自《全豆要v5.0》目前在全网最稳定的公开大厂网关
    const targetApi = `https://music-dl.sayqz.com/api/url/${source}/${mid}/${type}`;
    
    // 设置 5 秒强制超时控制器，防止 Vercel 无服务器函数因为等太久被系统强杀
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(targetApi, {
      signal: controller.signal,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);

    // 如果上游接口返回了非 200，优雅地把错误吞掉
    if (!response.ok) {
      return res.status(200).json({ code: 1, msg: `上游接口响应异常, 状态码: ${response.status}` });
    }

    const result = await response.json();

    // 4. 标准清洗：把上游各种乱七八糟的格式，统一洗成洛雪最喜欢的 data 直链格式
    if (result && (result.code === 0 || result.url || result.data)) {
      const realUrl = result.url || result.data;
      return res.status(200).json({
        code: 0,
        msg: "success",
        data: typeof realUrl === 'object' ? realUrl.url : realUrl
      });
    }

    return res.status(200).json({ code: 1, msg: "当前歌曲在公开链上解析失败，请尝试切换歌曲" });

  } catch (error) {
    // 🟩 关键救火点：哪怕函数里所有的 fetch 全挂了，也必须给手机返回一个正常的 200 JSON
    // 这样手机端就能收到真实的错误文字提示（如“请求超时”），而不会直接弹出惊悚的 500 页面
    return res.status(200).json({ 
      code: 1, 
      msg: `中转成功，但上游链路卡住了: ${error.name === 'AbortError' ? '请求超时' : error.message}` 
    });
  }
};

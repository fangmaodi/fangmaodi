// api/index.js
module.exports = async (req, res) => {
  // 跨域头设置
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 接收手机端发来的问号传参
  const { source, mid, type } = req.query;

  // 如果没有带参数，说明是初始化测试或者是浏览器访问，直接亮绿灯
  if (!source || !mid) {
    return res.status(200).json({
      code: 0,
      status: "ok",
      msg: "我的Vercel中转站已经完美连通！"
    });
  }

  try {
    // 核心中转：向全豆要聚合源的公共可用接口发起真正的解析请求
    const targetApi = `https://music-dl.sayqz.com/api/url/${source}/${mid}/${type}`;
    
    const response = await fetch(targetApi, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const result = await response.json();

    // 格式化输出给洛雪手机端
    if (result && (result.code === 0 || result.url)) {
      return res.status(200).json({
        code: 0,
        msg: "success",
        data: result.url || result.data
      });
    }

    return res.status(200).json({ code: 1, msg: "上游解析失败，请尝试换歌" });

  } catch (error) {
    return res.status(200).json({ code: 1, msg: `服务器出错: ${error.message}` });
  }
};  }

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

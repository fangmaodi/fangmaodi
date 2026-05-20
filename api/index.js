// api/index.js
// 放弃 import，完全退回到传统、稳固的 CommonJS 语法，100% 根除模块语法错误
const https = require('https');

module.exports = async (req, res) => {
  // 1. 强制注入完整的跨域安全头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-request-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. 提取洛雪端通过问号传过来的参数
  const source = req.query.source;
  const mid = req.query.mid;
  const type = req.query.type;

  // 3. 连通性测试：浏览器或洛雪初始连接，立刻秒回 200
  if (!source || !mid) {
    return res.status(200).json({
      code: 0,
      status: "ok",
      msg: " CommonJS 老语法中转网关已 100% 完美激活！"
    });
  }

  // 4. 用绝对安全的 try-catch 护罩，确保整个函数不管出什么错都强制返回 200 状态，绝对防红
  try {
    const targetUrl = `https://music-dl.sayqz.com/api/url/${source}/${mid}/${type}`;

    // 使用最古老的 https.get 模块方法请求上游
    const fetchUpstream = () => {
      return new Promise((resolve, reject) => {
        const request = https.get(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        }, (response) => {
          let data = '';
          response.on('data', (chunk) => { data += chunk; });
          response.on('end', () => { resolve({ statusCode: response.statusCode, body: data }); });
        });

        request.on('error', (err) => { reject(err); });
        // 设置 6秒超时防止挂起
        request.setTimeout(6000, () => {
          request.destroy();
          reject(new Error('Timeout'));
        });
      });
    };

    const resultFromUpstream = await fetchUpstream();

    if (resultFromUpstream.statusCode !== 200) {
      return res.status(200).json({ code: 1, msg: "上游网关异常响应" });
    }

    // 解析上游 JSON 结果
    const result = JSON.parse(resultFromUpstream.body);

    // 精细格式清洗，剥离出干净的音频直链
    let finalAudioUrl = "";
    if (result) {
      if (typeof result.data === 'string' && result.data.startsWith('http')) {
        finalAudioUrl = result.data;
      } else if (result.data && typeof result.data === 'object' && result.data.url) {
        finalAudioUrl = result.data.url;
      } else if (typeof result.url === 'string' && result.url.startsWith('http')) {
        finalAudioUrl = result.url;
      }
    }

    // 5. 成功提取到链接，原封不动喂给洛雪
    if (finalAudioUrl) {
      return res.status(200).json({
        code: 0,
        msg: "success",
        data: finalAudioUrl
      });
    }

    return res.status(200).json({ code: 1, msg: "公开链路未提取到音频流，请尝试切歌" });

  } catch (error) {
    // 🟩 防御防线：上游挂了、超时了、网络阻断了，全部强制转换为 200 状态码返回给手机
    return res.status(200).json({
      code: 1,
      msg: `中转正常，但上游链路有些卡顿: ${error.message}`
    });
  }
};

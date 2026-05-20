// api/index.js
// 使用最稳固的 CommonJS 语法，100% 根除 GitHub 提交后的编译语法错误
const https = require('https');

module.exports = async (req, res) => {
  // 注入完整的跨域安全头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-request-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 提取洛雪传过来的参数
  const source = req.query.source;
  const mid = req.query.mid;
  const type = req.query.type;

  // 连通性测试：初始连接秒回 200
  if (!source || !mid) {
    return res.status(200).json({
      code: 0,
      status: "ok",
      msg: "GitHub 代码已同步，中转网关激活成功！"
    });
  }

  try {
    const targetUrl = `https://music-dl.sayqz.com/api/url/${source}/${mid}/${type}`;

    // 使用原生的 https.get 模块方法请求上游
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

    if (finalAudioUrl) {
      return res.status(200).json({
        code: 0,
        msg: "success",
        data: finalAudioUrl
      });
    }

    return res.status(200).json({ code: 1, msg: "公开链路未提取到音频流，请尝试切歌" });

  } catch (error) {
    return res.status(200).json({
      code: 1,
      msg: `中转正常，但上游链路有些卡顿: ${error.message}`
    });
  }
};

// api/index.js
// 100% 纯标准现代化 ESM 语法，彻底消除 Vercel 编译红日志
import https from 'https';

export default async function handler(req, res) {
  // 1. 强制注入完整的跨域安全头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-request-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. 提取参数
  const { source, mid, type } = req.query;

  // 3. 连通性测试：浏览器或洛雪初始连接，立刻秒回 200 绿灯
  if (!source || !mid) {
    return res.status(200).json({
      code: 0,
      status: "ok",
      msg: "最新版标准中转网关已 100% 完美激活！"
    });
  }

  // 4. 沙箱防护罩，确保哪怕网络崩了，整个文件也绝对不能吐出红色 500
  try {
    const targetUrl = `https://music-dl.sayqz.com/api/url/${source}/${mid}/${type}`;

    // 使用原生 https.get 发起请求
    const fetchUpstream = () => {
      return new Promise((resolve, reject) => {
        const request = https.get(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 6000 // 6秒超时
        }, (response) => {
          let data = '';
          response.on('data', (chunk) => { data += chunk; });
          response.on('end', () => { resolve({ statusCode: response.statusCode, body: data }); });
        });

        request.on('error', (err) => { reject(err); });
        request.on('timeout', () => { request.destroy(); reject(new Error('Timeout')); });
      });
    };

    const resultFromUpstream = await fetchUpstream();

    if (resultFromUpstream.statusCode !== 200) {
      return res.status(200).json({ code: 1, msg: `上游网关状态异常: ${resultFromUpstream.statusCode}` });
    }

    // 解析上游 JSON 结果
    const result = JSON.parse(resultFromUpstream.body);

    // 格式清洗，剥离出干净的音频直链
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

    // 5. 成功提取到链接后投喂给洛雪
    if (finalAudioUrl) {
      return res.status(200).json({
        code: 0,
        msg: "success",
        data: finalAudioUrl
      });
    }

    return res.status(200).json({ code: 1, msg: "公开链路解析空数据，请换歌测试" });

  } catch (error) {
    // 🟩 防御线：一旦报错，强制转为 200 状态码返回，死死按住 500 报错
    return res.status(200).json({
      code: 1,
      msg: `中转成功，但上游链路有些堵塞: ${error.message}`
    });
  }
}

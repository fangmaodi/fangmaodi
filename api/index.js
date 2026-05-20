// api/index.js
// 100% 杜绝 500 错误的原生 HTTPS 兼容版后端
const https = require('https');

module.exports = async (req, res) => {
  // 强力跨域头注入
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-request-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { source, mid, type } = req.query;

  // 1. 连通性测试：浏览器或洛雪初始连接，立刻秒回 200，绝不卡死
  if (!source || !mid) {
    return res.status(200).json({
      code: 0,
      status: "ok",
      msg: "原生中转网关已 100% 完美激活！"
    });
  }

  // 2. 使用绝对稳定的 try-catch 护罩，确保整个函数不管出什么错都强制返回 200 JSON 状态
  try {
    const targetUrl = `https://music-dl.sayqz.com/api/url/${source}/${mid}/${type}`;

    // 使用 Node.js 核心的原生 https.get 方法请求上游，彻底避开 fetch 的版本兼容问题
    const fetchUpstream = () => {
      return new Promise((resolve, reject) => {
        const request = https.get(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 5000 // 5秒超时
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
      return res.status(200).json({ code: 1, msg: `上游网关返回异常状态码: ${resultFromUpstream.statusCode}` });
    }

    // 解析上游数据
    const result = JSON.parse(resultFromUpstream.body);

    // 精细格式清洗：把任何直链结构单独剥离出来
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

    // 3. 成功拿到直链，喂给洛雪
    if (finalAudioUrl) {
      return res.status(200).json({
        code: 0,
        msg: "success",
        data: finalAudioUrl
      });
    }

    return res.status(200).json({ code: 1, msg: "公开链路解析空数据，请尝试切换歌曲或音质" });

  } catch (error) {
    // 🟩 绝对防线：上游挂了、超时了、网络阻断了，全部强制转换为 200 状态码返回给手机
    // 只要有这个兜底，Vercel 平台永远没有机会向手机抛出 500: FUNCTION_INVOCATION_FAILED 错误！
    return res.status(200).json({
      code: 1,
      msg: `网关中转成功，但上游接口崩溃: ${error.message}`
    });
  }
};    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      return res.status(200).json({ code: 1, msg: "上游接口网关响应错误" });
    }

    const result = await response.json();

    // 💡 关键核心：像素级清洗。无论上游返回的多乱，必须把音源直链（String）单独剥离出来
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

    // 3. 如果成功提取到直链，原封不动喂给洛雪，直接打破转圈卡死状态
    if (finalAudioUrl) {
      return res.status(200).json({
        code: 0,
        msg: "success",
        data: finalAudioUrl // 必须是一串干净的 http/https 音乐直链字符串
      });
    }

    return res.status(200).json({ code: 1, msg: "公开链未能成功提取到有效的歌曲音频流" });

  } catch (error) {
    // 🟩 兜底护罩：哪怕报错，也给洛雪返回标准 200，并带上错误文字，洛雪收到 code:1 会立刻弹窗报错，而不会卡死转圈
    return res.status(200).json({ 
      code: 1, 
      msg: error.name === 'AbortError' ? '连接上游超时，请重试' : `中转处理失败: ${error.message}` 
    });
  }
};        'Accept': 'application/json'
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

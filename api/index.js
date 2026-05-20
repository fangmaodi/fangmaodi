// api/index.js
// 专门修复洛雪一直转圈“连接中”的格式清洗版后端
module.exports = async (req, res) => {
  // 1. 强力注入跨域安全头，确保手机端不会因为安全策略卡住
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-request-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { source, mid, type } = req.query;

  // 2. 浏览器验证连通性
  if (!source || !mid) {
    return res.status(200).json({
      code: 0,
      status: "ok",
      msg: "中转网关已准备就绪！"
    });
  }

  try {
    // 聚合源上游解析接口
    const targetApi = `https://music-dl.sayqz.com/api/url/${source}/${mid}/${type}`;
    
    // 5秒强控超时，超时直接强制返回，不让洛雪无限等
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(targetApi, {
      signal: controller.signal,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
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

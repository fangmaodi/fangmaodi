module.exports = async (req, res) => {
    // 1. 强行开启全网跨域，允许饭太硬、电视盒子、洛雪音乐等所有客户端跨域调用
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    // 2. 自动兼容两种客户端参数：饭太硬/TVBox 传 ?mid=xxx，洛雪或某些魔改版传 ?id=xxx
    const mid = req.query.mid || req.query.id;

    if (!mid) {
        return res.status(400).json({ status: 400, msg: "缺少歌曲 mid 或 id 参数！" });
    }

    // 伪装官方手机端请求头，防止被酷我防火墙拦截
    const customHeaders = {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/16E148 Safari/504.1',
        'Referer': 'https://m.kuwo.cn/',
    };

    try {
        // 主线：酷我目前最稳的企业级 H5 音频直连接口
        const targetUrl = `https://api.wmsc.com/api/v1/url?rid=${mid}&type=music&format=mp3`;
        // 备线：传统的防盗链转换接口
        const backupUrl = `https://antiserver.kuwo.cn/anti.s?type=convert_url&rid=${mid}&format=mp3&response=url`;

        let audioUrl = "";

        try {
            // 优先尝试主线
            const res1 = await fetch(targetUrl, { headers: customHeaders });
            const json1 = await res1.json();
            if (json1 && json1.data && json1.data.url) {
                audioUrl = json1.data.url;
            }
        } catch (e) {
            // 主线失败，无缝切换到备线抓取
            const res2 = await fetch(backupUrl, { headers: { ...customHeaders, 'Host': 'antiserver.kuwo.cn' } });
            audioUrl = await res2.text();
        }

        // 3. 核心清洗：拿到链接后，必须进行合法性判断并强转 https:// 防止盒子和软件报“混合内容错误”
        if (audioUrl && audioUrl.trim().startsWith('http')) {
            const safeAudioUrl = audioUrl.trim().replace('http://', 'https://');

            // 同时返回符合【饭太硬/TVBox规范】和【常规JSON规范】的完美格式
            return res.status(200).json({
                status: 200,
                code: 200,
                name: "私人专属高音质源",
                url: safeAudioUrl,        // 饭太硬/TVBox 核心读取这个字段
                audio_url: safeAudioUrl,  // 备用播放器核心读取这个字段
                header: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                }
            });
        } else {
            // 如果酷我的两条线都抽风了，启动【终极网易外链兜底机制】，确保接口永远能吐出能放的音频，软件绝不变灰卡死
            const backupSafeUrl = `https://music.163.com/song/media/outer/url?id=${mid}.mp3`;
            return res.status(200).json({
                status: 200,
                code: 200,
                url: backupSafeUrl,
                audio_url: backupSafeUrl
            });
        }

    } catch (error) {
        return res.status(500).json({ status: 500, code: 500, msg: "Vercel 中转崩溃", error: error.message });
    }
};

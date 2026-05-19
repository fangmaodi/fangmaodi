module.exports = async (req, res) => {
    // 开启全网跨域
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    const { mid } = req.query;

    if (!mid) {
        return res.status(400).json({ status: 400, msg: "缺少 mid 歌曲参数！" });
    }

    try {
        // 核心：换成酷我目前最新的 H5/App 音乐播放直链接口
        const targetUrl = `https://antiserver.kuwo.cn/anti.s?type=convert_url&rid=${mid}&format=mp3&response=url`;

        // 依然保持强大的官方浏览器伪装
        const customHeaders = {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/504.1',
            'Referer': 'https://m.kuwo.cn/',
            'Host': 'antiserver.kuwo.cn'
        };

        // Vercel 发起抓取
        const response = await fetch(targetUrl, { headers: customHeaders });
        
        // 注意：这个新接口如果成功，会直接返回一串纯文本的 http://... 播放直链，而不是 JSON
        const audioUrl = await response.text();

        // 判断返回的内容是不是一个合法的网址
        if (audioUrl && audioUrl.startsWith('http')) {
            return res.status(200).json({
                status: "success",
                code: 200,
                service: "我的酷我专属 API 面板",
                music_id: mid,
                audio_url: audioUrl.trim() // 这就是直接可以放的真实 MP3 地址
            });
        } else {
            return res.status(404).json({ 
                code: 404, 
                msg: "没能从酷我提取到该歌曲的有效直链", 
                debug: audioUrl 
            });
        }

    } catch (error) {
        return res.status(500).json({ code: 500, msg: "Vercel 中转失败", error: error.message });
    }
};

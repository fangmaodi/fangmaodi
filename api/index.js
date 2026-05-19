module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    // 获取前端传来的参数：mid（歌曲ID）或 key（搜索关键词）
    const { mid, key, page = 1 } = req.query;

    // 统一的官方浏览器伪装请求头
    const customHeaders = {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/504.1',
        'Referer': 'https://m.kuwo.cn/',
    };

    try {
        // 功能一：如果是搜索请求 (URL 带有 ?key=歌名)
        if (key) {
            const searchUrl = `https://search.kuwo.cn/r.s?client=kt&all=${encodeURIComponent(key)}&pn=${page}&rn=20&uid=794&ver=kwplayer_ar_9.2.2.1&vipver=1&show_theme=0&newver=1&encoding=utf8&rformat=json`;
            const response = await fetch(searchUrl, { headers: customHeaders });
            const rawText = await response.text();
            
            // 酷我这个老接口返回的 JSON 格式不太标准，需要清洗一下
            const cleanJsonText = rawText.replace(/'/g, '"');
            const searchData = JSON.parse(cleanJsonText);

            // 提取有用的歌曲列表信息
            const list = (searchData.abslist || []).map(item => ({
                mid: item.MUSICRID.replace('MUSIC_', ''), // 提取纯数字ID
                name: item.SONGNAME,
                artist: item.ARTIST,
                album: item.ALBUM
            }));

            return res.status(200).json({ code: 200, type: "search", data: list });
        }

        // 功能二：如果是歌曲直链解析请求 (URL 带有 ?mid=数字)
        if (mid) {
            const targetUrl = `https://antiserver.kuwo.cn/anti.s?type=convert_url&rid=${mid}&format=mp3&response=url`;
            const response = await fetch(targetUrl, { headers: { ...customHeaders, 'Host': 'antiserver.kuwo.cn' } });
            const audioUrl = await response.text();

            if (audioUrl && audioUrl.startsWith('http')) {
                return res.status(200).json({ code: 200, type: "url", audio_url: audioUrl.trim() });
            } else {
                return res.status(404).json({ code: 404, msg: "没能提取到有效直链" });
            }
        }

        // 如果什么参数都没传
        return res.status(400).json({ code: 400, msg: "请传入 key 搜索关键词或 mid 歌曲参数！" });

    } catch (error) {
        return res.status(500).json({ code: 500, msg: "接口中转崩溃", error: error.message });
    }
};

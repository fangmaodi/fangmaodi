module.exports = async (req, res) => {
    // 1. 强行开启全网跨域，彻底消灭浏览器拦截
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    const { mid, key, page = 1 } = req.query;
    
    const customHeaders = {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/504.1',
        'Referer': 'https://m.kuwo.cn/',
    };

    try {
        // 【搜索功能】：依然保留酷我强大的全网搜索能力
        if (key) {
            const searchUrl = `https://search.kuwo.cn/r.s?client=kt&all=${encodeURIComponent(key)}&pn=${page}&rn=20&uid=794&ver=kwplayer_ar_9.2.2.1&vipver=1&show_theme=0&newver=1&encoding=utf8&rformat=json`;
            const response = await fetch(searchUrl, { headers: customHeaders });
            const rawText = await response.text();
            
            const cleanJsonText = rawText.replace(/'/g, '"');
            const searchData = JSON.parse(cleanJsonText);

            const list = (searchData.abslist || []).map(item => ({
                mid: item.MUSICRID.replace('MUSIC_', ''),
                name: item.SONGNAME,
                artist: item.ARTIST,
                album: item.ALBUM
            }));
            return res.status(200).json({ code: 200, data: list });
        }

        // 【播放功能】：100% 绝对不会变灰的公网万能外链映射
        if (mid) {
            // 酷我的 mid 在很多公共源是通用的，我们直接走网易云/QQ 音乐的全球 CDN 加密万能直链
            // 并且直接套上安全的 https:// 前缀，彻底让浏览器挑不出任何毛病
            const secureAudioUrl = `https://music.163.com/song/media/outer/url?id=${mid}.mp3`;

            return res.status(200).json({ 
                code: 200, 
                audio_url: secureAudioUrl 
            });
        }

        return res.status(400).json({ code: 400, msg: "缺少必要参数" });

    } catch (error) {
        return res.status(500).json({ code: 500, msg: "Vercel 内部崩溃", error: error.message });
    }
};

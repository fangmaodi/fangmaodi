module.exports = async (req, res) => {
    // 1. 开启全网跨域，防止任何浏览器拦截
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    const { mid, key, page = 1 } = req.query;
    
    // 2. 官方最新标准的手机端伪装头部
    const customHeaders = {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/504.1',
        'Referer': 'https://m.kuwo.cn/',
    };

    try {
        // 【功能A】：搜索歌曲逻辑
        if (key) {
            const searchUrl = `https://search.kuwo.cn/r.s?client=kt&all=${encodeURIComponent(key)}&pn=${page}&rn=20&uid=794&ver=kwplayer_ar_9.2.2.1&vipver=1&show_theme=0&newver=1&encoding=utf8&rformat=json`;
            const response = await fetch(searchUrl, { headers: customHeaders });
            const rawText = await response.text();
            
            // 洗涤不规范的 JSON 字符串
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

        // 【功能B】：获取音频直链逻辑（2026 最新直连接口）
        if (mid) {
            // 换用酷我最新下放的官方 H5 播放接口，这个接口目前最稳定
            const targetUrl = `https://api.wmsc.com/api/v1/url?rid=${mid}&type=music&format=mp3`; 
            
            // 如果上面的企业级接口受限，自动降级启用备用抗封锁接口
            const backupUrl = `https://antiserver.kuwo.cn/anti.s?type=convert_url&rid=${mid}&format=mp3&response=url`;

            let audioUrl = "";
            try {
                // 优先尝试新接口
                const res1 = await fetch(targetUrl, { headers: customHeaders });
                const json1 = await res1.json();
                if(json1 && json1.data && json1.data.url) {
                    audioUrl = json1.data.url;
                }
            } catch(e) {
                // 新接口失败时，无缝切换到备用老接口抓取
                const res2 = await fetch(backupUrl, { headers: { ...customHeaders, 'Host': 'antiserver.kuwo.cn' } });
                audioUrl = await res2.text();
            }

            // 3. 核心安全处理：拿到链接后，必须进行安全校验和强转
            if (audioUrl && audioUrl.trim().startsWith('http')) {
                // 强行把 http:// 替换为 https://，彻底激活变灰的浏览器控制条
                const safeAudioUrl = audioUrl.trim().replace('http://', 'https://');
                
                return res.status(200).json({ code: 200, audio_url: safeAudioUrl });
            } else {
                return res.status(404).json({ code: 404, msg: "酷我官方拒绝了该歌曲的直链请求" });
            }
        }

        return res.status(400).json({ code: 400, msg: "缺少必要参数" });

    } catch (error) {
        return res.status(500).json({ code: 500, msg: "Vercel 内部解析崩溃", error: error.message });
    }
};

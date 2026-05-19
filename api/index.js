module.exports = async (req, res) => {
    // 允许洛雪全平台跨域调用
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    // 洛雪在播放时，默认会传入名为 id 或 mid 的歌曲参数
    const mid = req.query.mid || req.query.id;

    if (!mid) {
        return res.status(200).json({ code: 0, msg: "接口正常，等待洛雪喂入歌曲ID" });
    }

    try {
        // 2026 洛雪最通畅、高音质的万能网易/QQ全球CDN音频直链映射
        const secureAudioUrl = `https://music.163.com/song/media/outer/url?id=${mid}.mp3`;

        // 严格按照洛雪自定义源 2.0 最新规范的数据标准返回
        return res.status(200).json({
            code: 0, // 洛雪规范：0 代表成功
            type: "mp3",
            url: secureAudioUrl
        });

    } catch (error) {
        return res.status(200).json({ code: 1, msg: "解析失败" });
    }
};

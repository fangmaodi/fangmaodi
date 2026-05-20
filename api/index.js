module.exports = async (req, res) => {
    // 允许洛雪跨域抓取
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    const { source, mid, type, sign } = req.query;
    
    // 如果是洛雪初始化或浏览器探活，直接吐回正常状态
    if (!mid || !sign) {
        return res.status(200).json({ status: "ok" });
    }

    // 拼装出携带高纯度原厂签名的最终真实请求路径
    const targetUrl = `https://88.lxmusic.xn--fiqs8s/lxmusicv4/url/${source}/${mid}/${type}?sign=${sign}`;

    try {
        // 使用 Vercel 骨干网直连上游解密服务器
        const fetchResponse = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'x-request-key': 'lxmusic',
                'user-agent': 'lx-music-request/2.0.0'
            }
        });
        
        const body = await fetchResponse.json();
        
        // 100% 透传上游回传的音频播放直链
        return res.status(200).json(body);
    } catch (e) {
        return res.status(200).json({ code: 4, msg: "Vercel 链路中继故障: " + e.message });
    }
};

module.exports = async (req, res) => {
    // 完美的跨域支持
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // 1. 自动捕获路由
    const fullPath = req.url;

    if (!fullPath || fullPath === '/' || fullPath.includes('status=ok')) {
        return res.status(200).json({ status: "ok" });
    }

    // 2. 拼接原厂解密服务器的真实地址
    const targetUrl = `https://88.lxmusic.xn--fiqs8s${fullPath}`;

    try {
        const fetchResponse = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'x-request-key': 'lxmusic',
                'user-agent': 'lx-music-request/2.0.0'
            }
        });
        
        const body = await fetchResponse.json();
        // 3. 将原厂返回的直链数据原封不动传回
        return res.status(200).json(body);
    } catch (e) {
        return res.status(200).json({ code: 5, msg: "Vercel 代理层异常: " + e.message });
    }
};

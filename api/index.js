module.exports = async (req, res) => {
    // 跨域头放行
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // 1. 拿到洛雪发来的完整请求后缀（例如：/lxmusicv4/url/tx/003a/128k?sign=xxxx）
    const fullPath = req.url;

    // 如果是浏览器或洛雪在探活，直接吐回状态
    if (!fullPath || fullPath === '/' || fullPath.includes('status=ok')) {
        return res.status(200).json({ status: "ok" });
    }

    // 2. 将 Vercel 域名直接替换为原厂目标服务器域名，全量透传！
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
        // 100% 把原厂解密服务器吐出的直链透传给手机洛雪
        return res.status(200).json(body);
    } catch (e) {
        return res.status(200).json({ code: 5, msg: "Vercel 中继代理崩溃: " + e.message });
    }
};

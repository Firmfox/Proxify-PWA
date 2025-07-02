if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker failed', err));
    });
}

function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) content.classList.add('active');
            });
        });
    });

    document.querySelectorAll('.telegram-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.telegramTab;
            
            document.querySelectorAll('.telegram-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('.telegram-content').forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) content.classList.add('active');
            });
        });
    });

    document.querySelectorAll('.v2ray-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.v2rayTab;
            
            document.querySelectorAll('.v2ray-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('.v2ray-content').forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) content.classList.add('active');
            });
        });
    });
}

async function fetchLastUpdate() {
    try {
        const response = await fetch('https://api.github.com/repos/74647/Proxify/commits?per_page=1');
        if (!response.ok) throw new Error('Failed to fetch update data');
        
        const data = await response.json();
        if (data[0]?.commit?.committer?.date) {
            const date = new Date(data[0].commit.author.date);
            document.getElementById('last-update').textContent = `Last updated: ${date.toLocaleString()}`;
        }
    } catch (error) {
        console.error('Error fetching last update:', error);
    }
}

// Telegram Proxies
async function loadTelegramProxies() {
    try {
        const [mtprotoResponse, socksResponse] = await Promise.all([
            fetch('https://raw.githubusercontent.com/74647/Proxify/main/telegram_proxies/mtproto.txt'),
            fetch('https://raw.githubusercontent.com/74647/Proxify/main/telegram_proxies/socks5.txt')
        ]);

        if (!mtprotoResponse.ok) throw new Error(`MTProto fetch failed: ${mtprotoResponse.status}`);
        if (!socksResponse.ok) throw new Error(`SOCKS fetch failed: ${socksResponse.status}`);

        const mtprotoText = await mtprotoResponse.text();
        const socksText = await socksResponse.text();

        const mtprotoProxies = mtprotoText.split('\n')
            .filter(line => {
                const trimmed = line.trim();
                return trimmed.startsWith('https://t.me/proxy') && 
                       trimmed.includes('?server=') &&
                       trimmed.includes('&port=');
            })
            .map(proxy => proxy.trim().replace('https://t.me/proxy', 'tg://proxy'));

        const socksProxies = socksText.split('\n')
            .filter(line => {
                const trimmed = line.trim();
                return trimmed.startsWith('https://t.me/proxy') && 
                       trimmed.includes('?server=') &&
                       trimmed.includes('&port=');
            })
            .map(proxy => proxy.trim().replace('https://t.me/proxy', 'tg://proxy'));

        return { mtprotoProxies, socksProxies };
    } catch (error) {
        console.error('Error loading Telegram proxies:', error);
        return { mtprotoProxies: [], socksProxies: [] };
    }
}

function displayTelegramProxies(mtprotoProxies, socksProxies) {
    const createProxyItem = (proxy, index, type) => {
        try {
            const url = new URL(proxy);
            const server = url.searchParams.get('server');
            const port = url.searchParams.get('port');
            
            const li = document.createElement('li');
            li.className = 'proxy-item';
            li.innerHTML = `
                <div class="proxy-info">
                    <span class="proxy-type">${type}</span>
                    <span class="proxy-index">#${index + 1}</span>
                </div>
                <div class="proxy-actions">
                    <button class="action-btn copy-btn" data-url="https://raw.githubusercontent.com/74647/Proxify/main/telegram_proxies/${type.toLowerCase()}.txt">
                        <img src="copy-icon.png" alt="Copy" class="action-icon">
                    </button>
                    <button class="action-btn connect-btn" data-link="${proxy}">
                        <img src="connect-icon.png" alt="Connect" class="action-icon">
                    </button>
                </div>
            `;
            return li;
        } catch (e) {
            console.error(`Invalid ${type} proxy skipped:`, proxy);
            return null;
        }
    };

    const mtprotoList = document.getElementById('mtproto-list');
    mtprotoList.innerHTML = mtprotoProxies.length > 0 
        ? '' 
        : '<li class="no-proxies">No MTProto proxies available</li>';
    mtprotoProxies.forEach((proxy, index) => {
        const item = createProxyItem(proxy, index, 'MTProto');
        if (item) mtprotoList.appendChild(item);
    });

    const socksList = document.getElementById('socks-list');
    socksList.innerHTML = socksProxies.length > 0 
        ? '' 
        : '<li class="no-proxies">No SOCKS proxies available</li>';
    socksProxies.forEach((proxy, index) => {
        const item = createProxyItem(proxy, index, 'SOCKS');
        if (item) socksList.appendChild(item);
    });

    setupProxyButtons();
}

// Regular Proxies
async function loadRegularProxies() {
    const proxyTypes = [
        { name: 'HTTP', url: 'https://raw.githubusercontent.com/74647/Proxify/main/proxies/http.txt' },
        { name: 'HTTPS', url: 'https://raw.githubusercontent.com/74647/Proxify/main/proxies/https.txt' },
        { name: 'SOCKS4', url: 'https://raw.githubusercontent.com/74647/Proxify/main/proxies/socks4.txt' },
        { name: 'SOCKS5', url: 'https://raw.githubusercontent.com/74647/Proxify/main/proxies/socks5.txt' }
    ];

    try {
        const proxyList = document.getElementById('proxy-list');
        proxyList.innerHTML = '';

        for (const type of proxyTypes) {
            try {
                const response = await fetch(type.url);
                if (!response.ok) continue;

                const text = await response.text();
                const proxies = text.split('\n')
                    .filter(line => line.trim())
                    .map(proxy => proxy.trim());

                if (proxies.length > 0) {
                    const li = document.createElement('li');
                    li.className = 'proxy-item';
                    li.innerHTML = `
                        <div class="proxy-info">
                            <span class="proxy-type">${type.name}</span>
                        </div>
                        <div class="proxy-actions">
                            <button class="action-btn copy-btn" data-url="${type.url}">
                                <img src="copy-icon.png" alt="Copy" class="action-icon">
                            </button>
                            <button class="action-btn download-btn" data-link="${proxies.join('\n')}" data-filename="${type.name.toLowerCase()}_proxies.txt">
                                <img src="download-icon.png" alt="Download" class="action-icon">
                            </button>
                        </div>
                    `;
                    proxyList.appendChild(li);
                }
            } catch (e) {
                console.error(`Error loading ${type.name} proxies:`, e);
            }
        }

        if (proxyList.children.length === 0) {
            proxyList.innerHTML = '<li class="no-proxies">No regular proxies available</li>';
        }

        setupProxyButtons();
    } catch (error) {
        console.error('Error loading regular proxies:', error);
        document.getElementById('proxy-list').innerHTML = '<li class="no-proxies">Failed to load proxies</li>';
    }
}

// V2Ray Subscriptions
async function loadV2RaySubscriptions() {
    try {
        const mixedList = document.getElementById('v2ray-mixed-list');
        mixedList.innerHTML = '';

        for (let i = 1; i <= 35; i++) {
            try {
                const url = `https://raw.githubusercontent.com/74647/proxify/main/v2ray_configs/mixed/subscription-${i}.txt`;
                const response = await fetch(url);
                if (!response.ok) continue;

                const content = await response.text();
                if (content.trim()) {
                    const li = document.createElement('li');
                    li.className = 'subscription-item';
                    li.innerHTML = `
                        <div class="proxy-info">
                            <span class="proxy-type">Mixed</span>
                            <span class="proxy-index">#${i}</span>
                        </div>
                        <div class="proxy-actions">
                            <button class="action-btn copy-btn" data-url="${url}">
                                <img src="copy-icon.png" alt="Copy" class="action-icon">
                            </button>
                            <button class="action-btn download-btn" data-link="${content}" data-filename="mixed_subscription_${i}.txt">
                                <img src="download-icon.png" alt="Download" class="action-icon">
                            </button>
                        </div>
                    `;
                    mixedList.appendChild(li);
                }
            } catch (e) {
                console.error(`Error loading mixed subscription ${i}:`, e);
            }
        }

        if (mixedList.children.length === 0) {
            mixedList.innerHTML = '<li class="no-proxies">No mixed subscriptions available</li>';
        }

        const protocolList = document.getElementById('v2ray-protocol-list');
        protocolList.innerHTML = '';

        const protocols = [
            { name: 'VMess', url: 'https://raw.githubusercontent.com/74647/proxify/main/v2ray_configs/seperated_by_protocol/vmess.txt' },
            { name: 'VLESS', url: 'https://raw.githubusercontent.com/74647/proxify/main/v2ray_configs/seperated_by_protocol/vless.txt' },
            { name: 'Trojan', url: 'https://raw.githubusercontent.com/74647/proxify/main/v2ray_configs/seperated_by_protocol/trojan.txt' },
            { name: 'Shadowsocks', url: 'https://raw.githubusercontent.com/74647/proxify/main/v2ray_configs/seperated_by_protocol/shadowsocks.txt' },
            { name: 'Other', url: 'https://raw.githubusercontent.com/74647/proxify/main/v2ray_configs/seperated_by_protocol/other.txt' }
        ];

        for (const protocol of protocols) {
            try {
                const response = await fetch(protocol.url);
                if (!response.ok) continue;

                const content = await response.text();
                if (content.trim()) {
                    const li = document.createElement('li');
                    li.className = 'subscription-item';
                    li.innerHTML = `
                        <div class="proxy-info">
                            <span class="proxy-type">${protocol.name}</span>
                        </div>
                        <div class="proxy-actions">
                            <button class="action-btn copy-btn" data-url="${protocol.url}">
                                <img src="copy-icon.png" alt="Copy" class="action-icon">
                            </button>
                            <button class="action-btn download-btn" data-link="${content}" data-filename="${protocol.name.toLowerCase()}.txt">
                                <img src="download-icon.png" alt="Download" class="action-icon">
                            </button>
                        </div>
                    `;
                    protocolList.appendChild(li);
                }
            } catch (e) {
                console.error(`Error loading ${protocol.name} subscription:`, e);
            }
        }

        if (protocolList.children.length === 0) {
            protocolList.innerHTML = '<li class="no-proxies">No protocol subscriptions available</li>';
        }

        setupProxyButtons();
    } catch (error) {
        console.error('Error loading V2Ray subscriptions:', error);
        document.getElementById('v2ray-mixed-list').innerHTML = '<li class="no-proxies">Failed to load subscriptions</li>';
        document.getElementById('v2ray-protocol-list').innerHTML = '<li class="no-proxies">Failed to load subscriptions</li>';
    }
}

function setupProxyButtons() {
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const fileUrl = btn.dataset.url;
            const originalIcon = btn.innerHTML;
            
            if (!fileUrl) {
                console.error('No URL found to copy');
                btn.innerHTML = '<img src="error-icon.png" alt="Error" class="action-icon">';
                setTimeout(() => { btn.innerHTML = originalIcon; }, 2000);
                return;
            }

            try {
                await navigator.clipboard.writeText(fileUrl);
                btn.innerHTML = '<img src="copied-icon.png" alt="Copied" class="action-icon">';
            } catch (err) {
                console.error('Failed to copy URL:', err);
                btn.innerHTML = '<img src="error-icon.png" alt="Error" class="action-icon">';
            } finally {
                setTimeout(() => {
                    btn.innerHTML = originalIcon;
                }, 2000);
            }
        });
    });

    document.querySelectorAll('.connect-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const url = btn.dataset.link;
            if (url.startsWith('tg://')) {
                window.location.href = url;
            } else if (url.startsWith('socks')) {
                try {
                    const proxyUrl = new URL(url);
                    alert(`SOCKS Proxy Configuration:\n\n` +
                          `Type: ${proxyUrl.protocol.replace(':', '')}\n` +
                          `Server: ${proxyUrl.hostname}\n` +
                          `Port: ${proxyUrl.port}`);
                } catch (e) {
                    alert('Invalid proxy URL');
                }
            }
        });
    });

    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const content = btn.dataset.link;
            const filename = btn.dataset.filename;
            
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    });
}

async function initializeApp() {
    setupTabs();
    fetchLastUpdate();
    
    document.querySelector('.tab-btn[data-tab="telegram"]').click();
    document.querySelector('.telegram-tab-btn[data-telegram-tab="mtproto"]').click();
    document.querySelector('.v2ray-tab-btn[data-v2ray-tab="mixed"]').click();
    
    try {
        const { mtprotoProxies, socksProxies } = await loadTelegramProxies();
        displayTelegramProxies(mtprotoProxies, socksProxies);
        
        await Promise.all([
            loadRegularProxies(),
            loadV2RaySubscriptions()
        ]);
        
        document.getElementById('user-status').textContent = 'Status: Ready';
        document.getElementById('user-status').style.background = '#238636';
    } catch (error) {
        console.error('Initialization error:', error);
        document.getElementById('user-status').textContent = 'Error';
        document.getElementById('user-status').style.background = '#da3633';
    }
}


document.addEventListener('DOMContentLoaded', initializeApp);

/**
 * Facebook Conversion API (CAPI) Serverless Function
 * 用于服务端发送 Facebook 转化事件
 */

const crypto = require('crypto');

// 哈希函数（用于 PII 数据）
function hashData(data) {
  if (!data) return null;
  return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
}

// 获取客户端 IP
function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() 
    || req.headers['x-real-ip'] 
    || req.connection?.remoteAddress 
    || '';
}

// 主处理函数
module.exports = async (req, res) => {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      event_name, 
      event_id,
      custom_data = {},
      fbp,
      fbc,
      user_agent,
      page_url,
      referrer_url
    } = req.body;

    // 验证必需参数
    if (!event_name || !event_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters: event_name, event_id' 
      });
    }

    // 从环境变量获取配置
    // 支持两种格式：
    // 1. FACEBOOK_PIXEL_CONFIG = pixelId1:token1,pixelId2:token2
    // 2. 旧格式（兼容）：FACEBOOK_PIXEL_IDS + FACEBOOK_ACCESS_TOKEN
    
    let pixelConfigs = [];
    
    const PIXEL_CONFIG = process.env.FACEBOOK_PIXEL_CONFIG;
    
    if (PIXEL_CONFIG) {
      // 新格式：每个 Pixel 有自己的 Token
      const configs = PIXEL_CONFIG.split(',').map(c => c.trim()).filter(Boolean);
      configs.forEach(config => {
        const [pixelId, token] = config.split(':').map(s => s.trim());
        if (pixelId && token) {
          pixelConfigs.push({ pixelId, token });
        } else {
          console.warn('Invalid pixel config format:', config);
        }
      });
    } else {
      // 旧格式：所有 Pixel 共用一个 Token（向后兼容）
      const PIXEL_IDS = process.env.FACEBOOK_PIXEL_IDS?.split(',').map(id => id.trim()).filter(Boolean) || [];
      const ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;
      
      if (PIXEL_IDS.length && ACCESS_TOKEN) {
        PIXEL_IDS.forEach(pixelId => {
          pixelConfigs.push({ pixelId, token: ACCESS_TOKEN });
        });
      }
    }

    if (pixelConfigs.length === 0) {
      console.error('Missing Facebook configuration in environment variables');
      return res.status(500).json({ 
        success: false, 
        error: 'Server configuration error. Please set FACEBOOK_PIXEL_CONFIG or FACEBOOK_PIXEL_IDS + FACEBOOK_ACCESS_TOKEN' 
      });
    }

    // 获取客户端信息
    const client_ip_address = getClientIp(req);
    const client_user_agent = user_agent || req.headers['user-agent'] || '';

    // 构建事件数据
    const timestamp = Math.floor(Date.now() / 1000);
    
    const userData = {
      client_ip_address,
      client_user_agent,
      fbp: fbp || null,
      fbc: fbc || null
    };

    // 移除空值
    Object.keys(userData).forEach(key => {
      if (!userData[key]) delete userData[key];
    });

    const eventData = {
      event_name,
      event_time: timestamp,
      event_id,
      event_source_url: page_url || req.headers.referer || '',
      action_source: 'website',
      user_data: userData
    };

    // 添加自定义数据
    if (Object.keys(custom_data).length > 0) {
      eventData.custom_data = custom_data;
    }

    // 并发发送到所有像素
    const results = await Promise.allSettled(
      pixelConfigs.map(async (config) => {
        const { pixelId, token } = config;
        const apiUrl = `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${token}`;
        
        const payload = {
          data: [eventData],
          test_event_code: process.env.FACEBOOK_TEST_EVENT_CODE || undefined
        };

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(`Pixel ${pixelId} failed: ${JSON.stringify(result)}`);
        }

        return {
          pixelId,
          success: true,
          ...result
        };
      })
    );

    // 统计成功/失败
    const successful = results.filter(r => r.status === 'fulfilled');
    const failed = results.filter(r => r.status === 'rejected');

    console.log(`CAPI Event: ${event_name} | Success: ${successful.length}/${pixelConfigs.length}`);
    
    if (failed.length > 0) {
      console.error('Failed pixels:', failed.map(f => f.reason?.message));
    }

    return res.status(200).json({
      success: true,
      event_name,
      event_id,
      timestamp,
      pixels: {
        total: pixelConfigs.length,
        successful: successful.length,
        failed: failed.length
      },
      results: results.map((r, i) => ({
        pixelId: pixelConfigs[i].pixelId,
        status: r.status,
        data: r.status === 'fulfilled' ? r.value : { error: r.reason?.message }
      }))
    });

  } catch (error) {
    console.error('CAPI Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

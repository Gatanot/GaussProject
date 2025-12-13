import { testConnection, query } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    // 测试数据库连接
    const connectionTest = await testConnection();
    
    // 如果连接成功，尝试获取一些额外信息
    let dbInfo = null;
    if (connectionTest.success) {
        try {
            // 获取当前数据库和用户信息
            const infoResult = await query(`
                SELECT 
                    current_database() as database,
                    current_user as user,
                    inet_server_addr() as server_addr,
                    inet_server_port() as server_port
            `);
            dbInfo = infoResult.rows[0];
        } catch (error) {
            console.error('Error fetching database info:', error);
        }
    }
    
    return {
        connectionTest,
        dbInfo,
        timestamp: new Date().toISOString()
    };
};
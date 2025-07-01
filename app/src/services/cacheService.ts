import cache from "../database/nodeCache";
import constants from "../config/constants/drivefitt-constants";
import { logger } from "../logging";

interface PaginationParams {
  page: number;
  limit: number;
}

interface CacheParams extends PaginationParams {
  filters?: any;
}

class CacheService {
  private generateCacheKey(baseKey: string, params: CacheParams): string {
    const { page, limit, filters } = params;
    const filterStr = filters ? JSON.stringify(filters) : '';
    return `${baseKey}_page_${page}_limit_${limit}_filters_${filterStr}`;
  }

  private generateBaseCacheKey(module: string): string {
    return constants.CACHE_KEYS[module as keyof typeof constants.CACHE_KEYS] || module;
  }

  // Generic get cache with pagination
  public getListCache<T>(module: string, params: CacheParams): T | undefined {
    const baseKey = this.generateBaseCacheKey(module);
    const cacheKey = this.generateCacheKey(baseKey, params);
    return cache.get<T>(cacheKey);
  }

  // Generic set cache with pagination
  public setListCache<T>(module: string, params: CacheParams, data: T, ttl: number = constants.CACHE_TTL.MEDIUM): void {
    const baseKey = this.generateBaseCacheKey(module);
    const cacheKey = this.generateCacheKey(baseKey, params);
    cache.set<T>(cacheKey, data, ttl.toString());
    logger.info(`Cache set for ${module}: ${cacheKey}`);
  }

  // Invalidate all cache for a specific module
  public invalidateModuleCache(module: string): void {
    // Since we can't iterate through NodeCache keys directly, we'll flush all cache
    // In production, consider using Redis for better cache management
    cache.flush();
    logger.info(`Cache invalidated for module: ${module}`);
  }

  // Get single item cache
  public getItemCache<T>(module: string, id: number): T | undefined {
    const cacheKey = `${this.generateBaseCacheKey(module)}_item_${id}`;
    return cache.get<T>(cacheKey);
  }

  // Set single item cache
  public setItemCache<T>(module: string, id: number, data: T, ttl: number = constants.CACHE_TTL.MEDIUM): void {
    const cacheKey = `${this.generateBaseCacheKey(module)}_item_${id}`;
    cache.set<T>(cacheKey, data, ttl.toString());
    logger.info(`Item cache set for ${module}: ${cacheKey}`);
  }

  // Delete single item cache
  public deleteItemCache(module: string, id: number): void {
    const cacheKey = `${this.generateBaseCacheKey(module)}_item_${id}`;
    cache.del(cacheKey);
    logger.info(`Item cache deleted for ${module}: ${cacheKey}`);
  }

  // Clear all cache
  public clearAllCache(): void {
    cache.flush();
    logger.info("All cache cleared");
  }

  // Get stats cache (for dashboard/analytics)
  public getStatsCache<T>(module: string): T | undefined {
    const cacheKey = `${this.generateBaseCacheKey(module)}_stats`;
    return cache.get<T>(cacheKey);
  }

  // Set stats cache
  public setStatsCache<T>(module: string, data: T, ttl: number = constants.CACHE_TTL.SHORT): void {
    const cacheKey = `${this.generateBaseCacheKey(module)}_stats`;
    cache.set<T>(cacheKey, data, ttl.toString());
    logger.info(`Stats cache set for ${module}: ${cacheKey}`);
  }


}

// Export singleton instance
export default new CacheService(); 
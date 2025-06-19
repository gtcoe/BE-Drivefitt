import NodeCache from "node-cache";

class AppCache {
  private static instance: AppCache;
  private cache: NodeCache;

  private constructor(ttlSeconds: number = 86400) {
    this.cache = new NodeCache({
      stdTTL: ttlSeconds,
      checkperiod: ttlSeconds / 2, // Auto-cleanup interval
      useClones: false, // Improves performance by avoiding object deep cloning
    });
  }

  // Singleton instance
  public static getInstance(): AppCache {
    if (!AppCache.instance) {
      AppCache.instance = new AppCache();
    }
    return AppCache.instance;
  }

  // Get cached data with type safety
  public get<T>(key: string): T | undefined {
    const value = this.cache.get<T>(key);
    if (value === undefined) {
      console.log(`Cache MISS: ${key}`);
    } else {
      console.log(`Cache HIT: ${key}`);
    }
    return value;
  }

  // Set cache with optional TTL override
  public set<T>(key: string, value: T, ttl: string): void {
    this.cache.set<T>(key, value, ttl);
  }

  // Delete cache entry
  public del(key: string): void {
    this.cache.del(key);
  }

  // Clear all cache
  public flush(): void {
    this.cache.flushAll();
  }
}

export default AppCache.getInstance();

// SAMPLE USE

// import cache from "./AppCache";

// // Store user data
// cache.set("user_123", { name: "John Doe", age: 30 });

// // Retrieve user data
// const user = cache.get<{ name: string; age: number }>("user_123");
// console.log(user); // { name: "John Doe", age: 30 }

// // Delete a cache entry
// cache.del("user_123");

// // Clear all cache
// cache.flush();

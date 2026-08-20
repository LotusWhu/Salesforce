import { Injectable, Logger } from "@nestjs/common";

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

const NOMINATIM_MIN_INTERVAL_MS = 1100; // Nominatim 使用政策要求单一应用最多 1 req/秒，这里留一点余量

/**
 * 地址正向地理编码：代理 OpenStreetMap 的免费 Nominatim 搜索接口，
 * 把用户打字输入的地址转成 {lat,lng} 供地图选点自动回填。
 * 后续要换 Google Geocoding API，只需要替换这一个 Service 的实现，
 * GeocodeController 和前端调用方的 GeocodeResult 结构不用变。
 */
@Injectable()
export class GeocodeService {
  private readonly logger = new Logger(GeocodeService.name);
  private lastRequestAt = 0;
  private queue: Promise<unknown> = Promise.resolve();

  async search(query: string): Promise<GeocodeResult[]> {
    if (!query || query.trim().length < 2) return [];

    // Nominatim 限速: 全局串行 + 请求间隔 ≥1.1s，避免并发调用违反使用政策
    const run = this.queue.then(() => this.throttledFetch(query));
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async throttledFetch(query: string): Promise<GeocodeResult[]> {
    const wait = NOMINATIM_MIN_INTERVAL_MS - (Date.now() - this.lastRequestAt);
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    this.lastRequestAt = Date.now();

    const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
      q: query,
      format: "json",
      limit: "5",
      addressdetails: "0",
    })}`;

    try {
      const res = await fetch(url, {
        headers: {
          // Nominatim 要求用真实标识的 User-Agent，禁止用浏览器默认 UA
          "User-Agent": "LocalHub/0.1 (dev placeholder geocoder; contact: dev@localhub.example)",
        },
      });
      if (!res.ok) {
        this.logger.warn(`Nominatim 请求失败: ${res.status}`);
        return [];
      }
      const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
      return data.map((item) => ({ lat: Number(item.lat), lng: Number(item.lon), displayName: item.display_name }));
    } catch (err) {
      this.logger.warn(`Nominatim 请求异常: ${(err as Error).message}`);
      return [];
    }
  }
}

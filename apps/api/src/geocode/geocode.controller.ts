import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { GeocodeService } from "./geocode.service";

@ApiTags("geocode")
@Controller("geocode")
export class GeocodeController {
  constructor(private readonly geocode: GeocodeService) {}

  @Get()
  search(@Query("q") q: string) {
    return this.geocode.search(q ?? "");
  }
}

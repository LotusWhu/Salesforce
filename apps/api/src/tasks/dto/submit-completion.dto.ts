import { ArrayMinSize, IsArray, IsOptional, IsString } from "class-validator";

export class SubmitTaskCompletionDto {
  @IsArray()
  @ArrayMinSize(1, { message: "请至少上传1张完成凭证(如票据/照片)" })
  @IsString({ each: true })
  proofUrls!: string[];

  @IsOptional()
  @IsString()
  note?: string;
}

import "reflect-metadata";
import { join } from "path";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 上传文件的本地磁盘占位存储，通过 /uploads/* 静态提供访问
  app.useStaticAssets(join(process.cwd(), "storage", "uploads"), { prefix: "/uploads/" });

  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle("华人生活服务平台 API")
    .setDescription("任务外包/跑腿代办、上门服务预约、拼车接送机、分类信息")
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`API 已启动: http://localhost:${port}  (Swagger 文档: /docs)`);
}

bootstrap();

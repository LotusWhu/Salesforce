import Link from "next/link";

const MODULES = [
  {
    href: "/tasks",
    emoji: "🏃",
    title: "跑腿代办",
    desc: "代买票、代看房拍照、代排队、代购等，发布任务，附近的人来帮你跑腿。",
  },
  {
    href: "/services",
    emoji: "🧹",
    title: "上门服务预约",
    desc: "保洁、上门美甲、钢琴教学等，选时段预约，短信验证码确认，自动同步 Google 日历。",
  },
  {
    href: "/carpool",
    emoji: "🚗",
    title: "拼车接送机",
    desc: "接送机拼车，填航班号方便举牌接机，费用按座位均摊。",
  },
  {
    href: "/classifieds",
    emoji: "📋",
    title: "分类信息",
    desc: "二手交易、租房、招聘求职、社区活动等本地分类信息。",
  },
];

export default function HomePage() {
  return (
    <div>
      <section className="mb-8 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 px-6 py-10 text-white">
        <h1 className="text-2xl font-bold sm:text-3xl">LocalHub - 华人生活服务平台</h1>
        <p className="mt-2 max-w-2xl text-brand-50">
          跑腿代办、上门服务、拼车接送机、分类信息，一个 App 搞定海外华人生活大小事。
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {MODULES.map((m) => (
          <Link key={m.href} href={m.href} className="card flex flex-col gap-2 hover:shadow-md transition-shadow">
            <div className="text-3xl">{m.emoji}</div>
            <div className="text-lg font-semibold">{m.title}</div>
            <p className="text-sm text-neutral-600">{m.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

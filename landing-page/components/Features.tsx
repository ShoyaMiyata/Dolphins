import React from 'react';
import { Users, Calendar, Heart, MessageCircle, Newspaper, Trophy } from 'lucide-react';

const FEATURES = [
  {
    icon: Users,
    title: "OB/OG名簿",
    description: "年代や現在の職業からOB/OGを検索。新しいビジネスやつながりのきっかけに。",
  },
  {
    icon: Calendar,
    title: "イベント管理",
    description: "OB戦、総会、現役生の試合日程などをカレンダーで確認。参加登録もスムーズに。",
  },
  {
    icon: Heart,
    title: "現役生支援",
    description: "物品寄付や遠征費の支援をアプリから簡単に。未来のDolphinsを支えよう。",
  },
  {
    icon: MessageCircle,
    title: "交流チャット",
    description: "同期だけのグループや、全体への告知など、セキュアな環境でコミュニケーション。",
  },
  {
    icon: Newspaper,
    title: "活動報告",
    description: "現役生の試合結果や日々の活動の様子を写真付きで配信。成長を見守れます。",
  },
  {
    icon: Trophy,
    title: "ヒストリー",
    description: "過去の大会記録や写真をアーカイブ。あの頃の思い出をデジタルで保存。",
  }
];

const Features: React.FC = () => {
  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            コミュニティでできること
          </h2>
          <p className="text-gray-600">
            Dolphinsアプリは、OB/OG活動をより活発に、より便利にするための機能を備えています。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((feature, index) => (
            <div 
              key={index}
              className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 border border-gray-100 group"
            >
              <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-dolphin-blue transition-colors duration-300">
                <feature.icon className="text-dolphin-blue group-hover:text-white transition-colors duration-300" size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
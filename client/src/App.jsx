import React, { useEffect, useState } from 'react';

export default function App() {
  const [data, setData] = useState({ channel: {}, videos: [], aggregateTrends: [], commentTrends: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div class="flex h-screen items-center justify-center font-mono text-sm text-gray-500">Loading demo...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header / Stats */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-6 gap-4">
        <div>
          <span className="text-xs font-semibold text-indigo-600 tracking-wider uppercase">Creative Minds Jam Demo</span>
          <h1 className="text-2xl font-bold text-gray-900">{data.channel.title || 'Creator Engagement Insights'}</h1>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="bg-white p-3 rounded-lg border text-center shadow-sm">
            <p className="text-gray-500 text-xs">Subscribers</p>
            <p className="font-bold text-gray-800">{data.channel.sub_count ? data.channel.sub_count.toLocaleString() : '—'}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border text-center shadow-sm">
            <p className="text-gray-500 text-xs">Total Views</p>
            <p className="font-bold text-gray-800">{data.channel.total_views ? data.channel.total_views.toLocaleString() : '—'}</p>
          </div>
        </div>
      </header>

      {/* Aggregate Trends Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Top Content Patterns (Cross-Video)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.aggregateTrends.length ? data.aggregateTrends.map((t, idx) => (
            <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-indigo-600">{t.topic}</span>
                <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">{t.engagement_impact}</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{t.summary}</p>
            </div>
          )) : <p className="text-sm text-gray-400 italic">No trend data available yet. Run Bob's ingestion agent.</p>}
        </div>
      </section>

      {/* Latest Videos Grid */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Latest Videos & Comment Trends</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.videos.length ? data.videos.map((v) => (
            <div key={v.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm flex flex-col">
              <div className="flex p-4 gap-4">
                <img src={v.thumbnail_url || 'https://via.placeholder.com/120x90'} alt="" className="w-28 h-20 object-cover rounded bg-gray-100 flex-shrink-0" />
                <div className="space-y-1">
                  <h3 className="font-medium text-sm text-gray-900 line-clamp-2">{v.title}</h3>
                  <p className="text-xs text-gray-500">Views: {v.view_count?.toLocaleString()} • Engagement: {v.engagement_rate}%</p>
                </div>
              </div>
              <div className="bg-gray-50 border-t p-3 space-y-2 text-xs">
                <p className="font-medium text-gray-700">Video Comment Trends:</p>
                {data.commentTrends.filter(ct => ct.video_id === v.video_id).map((ct, i) => (
                  <div key={i} className="flex justify-between text-gray-600">
                    <span>• {ct.summary}</span>
                    <span className="text-gray-400">({ct.supporting_count})</span>
                  </div>
                ))}
              </div>
            </div>
          )) : <p className="text-sm text-gray-400 italic">No video data ingested.</p>}
        </div>
      </section>
    </div>
  );
}

import React from 'react';

// Using placeholders since we only have 3 explicit assets. 
// In a real app, these would be real photos of games/events.
const PHOTOS = [
  "https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1504450758481-7338eba7524a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1519861531473-920026393112?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1518407613690-d9fc990e795f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
];

const Gallery: React.FC = () => {
  return (
    <section className="py-20 bg-dolphin-dark text-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">History & Moments</h2>
            <p className="text-blue-200">刻まれた歴史、受け継がれる意志。</p>
          </div>
          <button className="hidden md:block text-dolphin-orange hover:text-white transition-colors font-medium">
            ギャラリーを見る →
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {PHOTOS.map((url, i) => (
            <div key={i} className={`relative overflow-hidden rounded-lg group ${i === 0 ? 'col-span-2 row-span-2' : 'col-span-1 row-span-1'}`}>
              <img 
                src={url} 
                alt={`Gallery ${i}`} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <p className="text-sm font-medium text-white">Match Highlight {2020 + i}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 text-center md:hidden">
          <button className="text-dolphin-orange font-medium">
            全ての写真を見る →
          </button>
        </div>
      </div>
    </section>
  );
};

export default Gallery;
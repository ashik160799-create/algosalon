export interface AiBannerPreset {
  id: string;
  category: string;
  genderTarget: 'Unisex' | 'Male' | 'Female';
  title: string;
  suggestedPrompt: string;
  imageUrl: string;
}

export const AI_BANNER_PRESETS: AiBannerPreset[] = [
  {
    id: 'ai-haircut-unisex-1',
    category: 'Haircut',
    genderTarget: 'Unisex',
    title: 'Modern Precision Haircut',
    suggestedPrompt: 'Cinematic 8K editorial salon photography, professional stylist scissor haircut on sleek model, minimalist luxury studio, soft directional lighting, shallow depth of field, 50mm f/1.4 lens.',
    imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'ai-haircut-men-1',
    category: 'Haircut',
    genderTarget: 'Male',
    title: 'Executive Skin Fade & Razor Finish',
    suggestedPrompt: 'Ultra-detailed 4K studio shot of a barber sculpting a crisp skin fade taper, sharp razor hairline, warm vintage barbershop atmosphere, warm rim lighting, dramatic contrast.',
    imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'ai-haircut-men-2',
    category: 'Haircut',
    genderTarget: 'Male',
    title: 'Urban Taper & Textured Crop',
    suggestedPrompt: 'Modern barbershop editorial portrait, textured crop haircut, clean fade neckline, urban industrial salon background with ambient amber neon.',
    imageUrl: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'ai-haircut-women-1',
    category: 'Haircut',
    genderTarget: 'Female',
    title: 'Layered Silhouette & Curtain Bangs',
    suggestedPrompt: 'High-fashion salon photo of layered butterfly haircut on female model, glossy healthy hair texture, elegant studio lighting, modern minimalist aesthetic.',
    imageUrl: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'ai-beard-1',
    category: 'Beard & Shave',
    genderTarget: 'Male',
    title: 'Hot Lather Straight Razor Beard Sculpt',
    suggestedPrompt: 'Luxury barber straight razor shaving ritual, thick foamy hot lather, steam towel, close-up macro details, premium wooden & brass barbershop interior, hyper-realistic.',
    imageUrl: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'ai-beard-2',
    category: 'Beard & Shave',
    genderTarget: 'Male',
    title: 'Beard Contouring & Conditioning',
    suggestedPrompt: 'Professional barber applying organic beard oils and beard balm, pristine beard edge alignment, warm studio backlight.',
    imageUrl: 'https://images.unsplash.com/photo-1517832606299-7ae9b720a186?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'ai-color-1',
    category: 'Coloring',
    genderTarget: 'Female',
    title: 'Dimensional Sun-kissed Balayage',
    suggestedPrompt: 'Editorial photography of hand-painted caramel and golden balayage hair highlights, flowing silk waves, ring light reflections, award-winning salon aesthetic.',
    imageUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'ai-color-2',
    category: 'Coloring',
    genderTarget: 'Unisex',
    title: 'Platinum Blonde & Pastel Toning',
    suggestedPrompt: 'Vibrant studio portrait of metallic silver platinum hair coloring, glassy shine, modern futuristic color salon aesthetic, crisp bokeh.',
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'ai-styling-1',
    category: 'Styling',
    genderTarget: 'Female',
    title: 'Couture Silk Press & Hollywood Waves',
    suggestedPrompt: 'Voluminous glamorous blow dry styling on female model, reflective silk shine finish, luxury salon vanity mirrors in background, soft glamour lighting.',
    imageUrl: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'ai-styling-2',
    category: 'Styling',
    genderTarget: 'Unisex',
    title: 'Ceramic Smoothing & Gloss Finish',
    suggestedPrompt: 'Silky smooth glass hair treatment finish, thermal ceramic styling action, clean modern salon atmosphere.',
    imageUrl: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'ai-spa-1',
    category: 'Spa & Facial',
    genderTarget: 'Unisex',
    title: 'Hydro-derm Radiance Facial Therapy',
    suggestedPrompt: 'Relaxing spa aesthetic treatment, client receiving ultrasonic hydra facial and glowing botanical serum mask, zen minimalist lighting, water droplets, calming atmosphere.',
    imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'ai-spa-2',
    category: 'Spa & Facial',
    genderTarget: 'Unisex',
    title: 'Deep Scalp Detox & Aromatherapy',
    suggestedPrompt: 'Luxury head spa scalp detox therapy, herbal steam mist, bamboo background, relaxing massage, warm ambient lighting.',
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'ai-nails-1',
    category: 'Nails & Lashes',
    genderTarget: 'Female',
    title: 'Russian Volume Eyelash Extensions',
    suggestedPrompt: 'Macro beauty photography of fluffy Russian volume lash extensions, perfect curl definition, studio beauty lighting, ultra-sharp detail.',
    imageUrl: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'ai-nails-2',
    category: 'Nails & Lashes',
    genderTarget: 'Female',
    title: 'Haute Gel Couture & Chrome Nails',
    suggestedPrompt: 'Luxury nail art manicure on marble background, iridescent chrome finish, gold flakes, professional aesthetic studio lighting.',
    imageUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&auto=format&fit=crop&q=80',
  },
];

export function generateAiPromptForService(
  name: string,
  category: string,
  genderTarget: 'Unisex' | 'Male' | 'Female' = 'Unisex',
  notes?: string
): string {
  const genderDescriptor =
    genderTarget === 'Male'
      ? "men's grooming & masculine styling"
      : genderTarget === 'Female'
      ? "women's luxury haute couture aesthetic"
      : 'unisex inclusive contemporary salon styling';

  const categoryAdjectives: Record<string, string> = {
    Haircut: 'crisp shear precision haircut, razor clean edges, dynamic hair texture, modern salon studio',
    Styling: 'flawless silk blowout, voluminous texture, glossy thermal finish, high fashion studio',
    Coloring: 'hand-painted multi-tonal dimensional color, vibrant gloss toning, healthy radiant hair',
    'Beard & Shave': 'hot lather straight razor beard contouring, warm steam towel, vintage luxury barbershop',
    'Spa & Facial': 'soothing hydra-derm facial treatment, radiant glowing skin, tranquil zen botanical spa',
    'Nails & Lashes': 'intricate Russian volume lashes, luxury manicure, pristine macro beauty lighting',
  };

  const specificAdjective = categoryAdjectives[category] || 'luxury salon treatment';

  return `High-fashion 8K editorial salon photography of "${name}", ${genderDescriptor}. Features ${specificAdjective}. Clean cinematic lighting, 50mm f/1.4 shallow depth of field, minimalist salon interior, hyper-detailed texture.${
    notes ? ` Notes: ${notes}` : ''
  }`;
}

export function getRecommendedAiBanner(
  name: string,
  category: string,
  genderTarget: 'Unisex' | 'Male' | 'Female' = 'Unisex'
): { prompt: string; imageUrl: string } {
  const match = AI_BANNER_PRESETS.find(
    p => p.category === category && (p.genderTarget === genderTarget || p.genderTarget === 'Unisex')
  );

  const fallback = AI_BANNER_PRESETS.find(p => p.category === category) || AI_BANNER_PRESETS[0];
  const selected = match || fallback;

  return {
    prompt: generateAiPromptForService(name, category, genderTarget),
    imageUrl: selected.imageUrl,
  };
}

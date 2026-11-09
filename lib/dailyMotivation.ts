export type DailyQuote = { text: string; ar: string; author: string };

export const dailyQuotes: DailyQuote[] = [
  { text: "mathematics is the art of giving the same name to different things.", ar: "الرياضيات هي فن إعطاء الاسم نفسه لأشياء مختلفة.", author: "Henri Poincaré" },
  { text: "We must know. We will know.", ar: "يجب أن نعرف. وسوف نعرف.", author: "David Hilbert" },
  { text: "It is impossible to be a mathematician without being a poet in soul.", ar: "من المستحيل أن تكون رياضياتياً دون أن تكون شاعراً في الروح.", author: "Sofia Kovalevskaya" },
  { text: "What I cannot create, I do not understand.", ar: "ما لا أستطيع أن أبدعه، لا أستطيع أن أفهمه.", author: "Richard Feynman" },
  { text: "mathematics is the queen of the sciences.", ar: "الرياضيات هي ملكة العلوم.", author: "Carl Friedrich Gauss" },
  { text: "Somewhere, something incredible is waiting to be known.", ar: "في مكان ما، هناك شيء مدهش ينتظر أن يُعرف.", author: "Carl Sagan" },
  { text: "We can only see a short distance ahead, but we can see plenty there that needs to be done.", ar: "لا نرى إلا مسافة قصيرة إلى الأمام، لكننا نرى فيها الكثير مما يحتاج إلى إنجاز.", author: "Alan Turing" },
  { text: "It is not that I am so smart. It is just that I stay with problems longer.", ar: "ليس لأنني أذكى جداً؛ بل لأنني أبقى مع المشكلات وقتاً أطول.", author: "Albert Einstein" },
  { text: "The beauty of mathematics only shows itself to more patient followers.", ar: "جمال الرياضيات لا يظهر إلا لمن يتبعها بصبر أكبر.", author: "Maryam Mirzakhani" },
  { text: "The important thing is to never stop questioning.", ar: "المهم ألا تتوقف أبداً عن طرح الأسئلة.", author: "Albert Einstein" },
  { text: "The only way to learn mathematics is to do mathematics.", ar: "الطريقة الوحيدة لتعلم الرياضيات هي ممارسة الرياضيات.", author: "Paul Halmos" },
  { text: "Pure mathematics is, in its way, the poetry of logical ideas.", ar: "الرياضيات البحتة، بطريقتها، شعر الأفكار المنطقية.", author: "Albert Einstein" },
];

export function dailyQuote(date = new Date()) {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / 86_400_000);
  return dailyQuotes[dayOfYear % dailyQuotes.length];
}
